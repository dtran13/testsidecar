describe("DataManager", function() {

    var metadata, app, dm, copiedUser;

    beforeEach(function() {
        app = SugarTest.app;
        dm = app.data;
        SugarTest.seedMetadata();
        app.config.maxQueryResult = 2;
        dm.reset();
        metadata = SugarTest.metadata;
        copiedUser = app.user.toJSON(); // save original to reset on teardown
        app.user.set(fixtures.user);
        app.user.id = "seed_sally_id";
    });


    afterEach(function() {
        app.user.set(copiedUser);
        app.events.off("data:sync:start data:sync:end");
    });

    it("should be able to create an empty instance of bean and collection", function() {
        dm.declareModels(metadata);

        _.each(_.keys(metadata.modules), function(moduleName) {
            expect(dm.createBean(moduleName)).toBeDefined();
            expect(dm.createBeanCollection(moduleName)).toBeDefined();
        });

    });

    it("should be able to create an instance of bean and collection", function() {
        var moduleName = "Contacts", bean, collection;

        dm.declareModel(moduleName, metadata.modules[moduleName]);

        bean = dm.createBean(moduleName, { someAttr: "Some attr value"});
        expect(bean.module).toEqual(moduleName);
        expect(bean.fields).toEqual(metadata.modules[moduleName].fields);
        expect(bean.get("someAttr")).toEqual("Some attr value");

        collection = dm.createBeanCollection(moduleName);
        expect(collection.module).toEqual(moduleName);
        expect(collection.model).toBeDefined();

    });

    it("should be able to fetch a bean by ID", function() {
        var moduleName = "Teams", mock, bean;

        dm.declareModel(moduleName, metadata.modules[moduleName]);

        mock = sinon.mock(app.Bean.prototype);
        mock.expects("sync").once().withArgs("read");

        bean = dm.createBean(moduleName, {id: "xyz"});
        bean.fetch();

        expect(bean.id).toEqual("xyz");
        expect(bean.module).toEqual(moduleName);
        mock.verify();
    });

    it("should be able to fetch beans", function() {
        var moduleName = "Teams", mock, collection;
        dm.declareModel(moduleName, metadata.modules[moduleName]);

        mock = sinon.mock(app.BeanCollection.prototype);
        mock.expects("sync").once().withArgs("read");

        collection = dm.createBeanCollection(moduleName, null);
        collection.fetch();

        expect(collection.module).toEqual(moduleName);
        expect(collection.model).toBeDefined();
        mock.verify();
    });

    it("should be able to sync (read) a bean", function() {
        var moduleName = "Contacts", bean, contact;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName, { id: "1234" });

        contact = SugarTest.loadFixture("contact");

        var cb1 = sinon.spy(), cb2 = sinon.spy();
        var sspy = sinon.spy(), cspy = sinon.spy();
        bean.on("data:sync:start", cb1);
        bean.on("data:sync:end", cb2);

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/Contacts\/1234.*/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(contact)]);

        expect(bean.dataFetched).toBeFalsy();
        bean.fetch({
            success: sspy,
            complete: cspy
        });

        expect(cb1).toHaveBeenCalled();
        SugarTest.server.respond();

        expect(cb2).toHaveBeenCalled();
        expect(bean.get("primary_address_city")).toEqual("Cupertino");
        expect(bean.get('_acl')).toBeDefined();
        expect(bean.dataFetched).toBeTruthy();
        expect(sspy).toHaveBeenCalled();
        expect(cspy).toHaveBeenCalled();
    });

    it("should fire GLOBAL data:sync:start and data:sync:end events", function() {
        var moduleName = "Contacts", bean, contact;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName, { id: "1234" });

        contact = SugarTest.loadFixture("contact");

        var cb1 = sinon.spy(), cb2 = sinon.spy();

        app.events.on("data:sync:start", cb1);
        app.events.on("data:sync:end", cb2);

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/Contacts\/1234.*/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(contact)]);

        bean.fetch({
            success: $.noop(),
            complete: $.noop()
        });

        expect(cb1).toHaveBeenCalledWith("read", bean);
        expect(cb2.called).toBe(false);
        cb1.reset();
        SugarTest.server.respond();
        expect(cb1.called).toBe(false);
        expect(cb2).toHaveBeenCalledWith("read", bean);
    });

    it("should fire MODEL data:sync:start and data:sync:end events", function() {
        var moduleName = "Contacts", bean, contact;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName, { id: "1234" });

        contact = SugarTest.loadFixture("contact");

        var cb1 = sinon.spy(), cb2 = sinon.spy();

        bean.on("data:sync:start", cb1);
        bean.on("data:sync:end", cb2);

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/Contacts\/1234.*/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(contact)]);

        bean.fetch({
            success: $.noop(),
            complete: $.noop()
        });

        expect(cb1).toHaveBeenCalledWith("read");
        expect(cb2.called).toBe(false);
        cb1.reset();
        SugarTest.server.respond();
        expect(cb1.called).toBe(false);
        expect(cb2).toHaveBeenCalledWith("read");
    });

    it("should be able to sync (create) a bean", function() {
        var moduleName = "Contacts", contact;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        contact = dm.createBean(moduleName, { first_name: "Clara", last_name: "Tsetkin" });

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("POST", /.*\/rest\/v10\/Contacts.*/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify({ id: "xyz" })]);

        contact.save();
        SugarTest.server.respond();

        expect(contact.id).toEqual("xyz");
    });

    it("should be able to sync (update) a bean", function() {
        var moduleName = "Contacts", contact;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        contact = dm.createBean(moduleName, { id: "xyz", first_name: "Clara", last_name: "Tsetkin", dateModified: "1" });

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("PUT", /.*\/rest\/v10\/Contacts\/xyz.*/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify({ dateModified: "2" })]);

        contact.save();
        SugarTest.server.respond();

        expect(contact.get("dateModified")).toEqual("2");
    });

    it("should be able to sync (delete) a bean", function() {
        var moduleName = "Contacts", contact;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        contact = dm.createBean(moduleName, { id: "xyz" });

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("DELETE", /.*\/rest\/v10\/Contacts\/xyz.*/,
            [200, {  "Content-Type": "application/json"}, ""]);

        contact.destroy();
        SugarTest.server.respond();
    });

    it("should be able to sync (read) beans", function() {
        var moduleName = "Contacts", beans, contacts;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        beans = dm.createBeanCollection(moduleName);

        contacts = SugarTest.loadFixture("contacts");

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/Contacts[?]{1}max_num=2.*/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(contacts)]);

        beans.fetch();
        SugarTest.server.respond();

        expect(beans.length).toEqual(2);
        expect(beans.at(0).get("name")).toEqual("Vladimir Vladimirov");
        expect(beans.at(1).get("name")).toEqual("Petr Petrov");
        expect(beans.at(1).module).toEqual("Contacts");
        expect(beans.at(1).fields).toBeDefined();
        expect(beans.at(0).get('_acl')).toBeDefined();
        expect(beans.at(0).get('_acl')["edit"]).toEqual("yes");
        expect(beans.at(0).get('_acl').fields).toBeDefined();
        expect(beans.at(0).get('_acl').fields["name"]).toBeDefined();
        expect(beans.at(0).get('_acl').fields["name"]["edit"]).toBeDefined();
        expect(beans.at(0).get('_acl').fields["name"]["edit"]).toEqual("no");
        expect(beans.at(1).get('_acl')).toBeUndefined();
    });

    it("should be able to handle sync errors", function() {
        var moduleName = "Contacts", bean, syncError, syncEnd, flag = false;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName);

        syncError = sinon.spy(function() {
            // Error callback must be called before data:sync:end gets triggered
            expect(flag).toBeFalsy();
        });
        syncEnd = sinon.spy(function() {
            flag = true;
        });

        bean.on("data:sync:end", syncEnd);
        SugarTest.seedFakeServer();
        SugarTest.server.respondWith([422, {}, ""]);
        bean.save(null, {error: syncError});
        SugarTest.server.respond();

        expect(syncError).toHaveBeenCalled();
        expect(syncEnd).toHaveBeenCalled();
    });

    it("should add result count and next offset to a collection if in server response", function(){
        var moduleName = "Contacts", beans, contacts;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        beans = dm.createBeanCollection(moduleName);

        contacts = SugarTest.loadFixture("contacts");

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/Contacts[?]{1}max_num=2.*/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(contacts)]);

        beans.fetch();
        SugarTest.server.respond();

        expect(beans.offset).toEqual(2);
    });

    it("should be able to prune fields user doesn't have access to by bean", function() {
        var moduleName = "Contacts", bean;

        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName, {first_name: "First", last_name:"Last", id:"123"});

        var acls = {};
        bean.set('_acl', acls);
        
        acls.fields = {"last_name":{"write":"no"}, "first_name":{"write":"yes"}, "id":{"write":"yes"}};

        var fields = dm.getEditableFields(bean);

        expect(fields["last_name"]).toBeFalsy();
        expect(fields["first_name"]).toBeTruthy();
        expect(fields["id"]).toBeTruthy();
    });

    it("should be able to prune fields user doesn't have access to", function() {
        var moduleName = "Contacts", bean;

        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName, {first_name: "First", last_name:"Last", id:"123"});
        var fields = dm.getEditableFields(bean);

        expect(fields["last_name"]).toBeFalsy();
        expect(fields["first_name"]).toBeTruthy();
        expect(fields["id"]).toBeTruthy();
    });
    
    it("should be able to fetch a collection with a custom endpoint", function() {
        var ajaxSpy = sinon.spy($, 'ajax'),
            moduleName = 'Contacts',
            records, endpoint;

        dm.declareModel(moduleName, metadata.modules[moduleName]);
        records = dm.createBeanCollection(moduleName);

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("POST",  /.*\/rest\/v10\/Contacts\/duplicateCheck/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(fixtures.api["rest/v10/search"].GET.response)]);

        endpoint = function (method, module, options, callbacks){
            var url = app.api.buildURL("Contacts", "duplicateCheck", null, {});
            return app.api.call('POST', url, null, callbacks);
        };
        records.fetch({
            module_list: ["Contacts"],
            endpoint: endpoint
        });

        SugarTest.server.respond();
        expect(ajaxSpy.getCall(0).args[0].url).toMatch(/.*\/rest\/v10\/Contacts\/duplicateCheck/);
        ajaxSpy.restore();
    });

    describe("parseOptionsForSync", function(){
        it("should add viewed=1 URL parameter only when viewed option is true", function(){
            var moduleName = "Contacts", bean;
            dm.declareModel(moduleName, metadata.modules[moduleName]);
            bean = dm.createBean(moduleName, {first_name: "First", last_name:"Last", id:"123"});
            var options = dm.parseOptionsForSync("read", bean, {viewed:true});
            expect(options.params.viewed).toEqual("1");
            options = dm.parseOptionsForSync("create", bean, {viewed:true});
            expect(options.params.viewed).toEqual("1");
            options = dm.parseOptionsForSync("read", bean, {viewed:false});
            expect(options.params.viewed).toBeUndefined();
            options = dm.parseOptionsForSync("read", bean, {});
            expect(options.params.viewed).toBeUndefined();
        });
    });
});
