describe("BeanCollection", function() {
    var metadata, app,
        dm = SUGAR.App.data;

    beforeEach(function() {
        app = SugarTest.app;
        app.config.maxQueryResult = 2;
        metadata = SugarTest.loadFixture("metadata");
        dm.reset();
    });

    it("should get records for page +n from the current", function() {
        app.config.maxQueryResult = 1;

        var moduleName = "Contacts", beans, contacts, syncSpy;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        beans = dm.createBeanCollection(moduleName);

        contacts = SugarTest.loadFixture("contacts");

        contacts.next_offset = 1;
        contacts.result_count = 1;
        contacts.records.pop();

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/Contacts\?max_num=1/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(contacts)]);
        syncSpy = sinon.spy(beans, "fetch");

        beans.fetch();
        SugarTest.server.respond();

        beans.paginate();
        expect(syncSpy).toHaveBeenCalledTwice();
        expect(syncSpy.getCall(1).args[0].offset).toEqual(1);
        syncSpy.restore();
    });
    it("should get records for page -n from the current", function() {
        app.config.maxQueryResult = 1;

        var moduleName = "Contacts", beans, contacts, syncSpy, options;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        beans = dm.createBeanCollection(moduleName);

        contacts = SugarTest.loadFixture("contacts");

        contacts.next_offset = 1;
        contacts.result_count = 1;
        contacts.records.pop();

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/Contacts\?max_num=1/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(contacts)]);
        syncSpy = sinon.spy(beans, "fetch");
        beans.fetch();
        SugarTest.server.respond();

        beans.paginate();
        expect(syncSpy).toHaveBeenCalledTwice();
        expect(syncSpy.getCall(1).args[0].offset).toEqual(1);
        options = {page: -1};
        beans.paginate(options);
        expect(syncSpy.getCall(2).args[0].offset).toEqual(-1);

        syncSpy.restore();
    });

    describe("paginate", function(){
        var fetchStub, beans;

        beforeEach(function(){
            var moduleName = "Contacts";
            dm.declareModel(moduleName, metadata.modules[moduleName]);
            beans = dm.createBeanCollection(moduleName);
            fetchStub = sinon.stub(beans, "fetch", $.noop());
        });

        afterEach(function(){
            fetchStub.restore();
        });

        it("should pass options.limit as fetch limit when it is set", function(){
            var options = {limit: 7};
            beans.paginate(options)
            expect(fetchStub.calledOnce).toBe(true);
            expect(fetchStub.args[0][0].limit).toEqual(options.limit);
        });

        it("should adjust offset based on options.limit when it is set", function(){
            var options = {
                limit: 7,
                page: 3
            };
            beans.paginate(options)
            expect(fetchStub.calledOnce).toBe(true);
            var fetchOptions = fetchStub.args[0][0];
            expect(fetchOptions.offset).toEqual(options.limit * 2);  //offset 2 page lengths to get 3rd page
        });

    });

    describe("getPageNumber", function(){
        var beans;

        beforeEach(function(){
            var moduleName = "Contacts";
            dm.declareModel(moduleName, metadata.modules[moduleName]);
            beans = dm.createBeanCollection(moduleName);
            app.config.maxQueryResult = 2;
        });

        it("should use options.limit as page length when available", function(){
            var options = {limit: 7};
            beans.offset = 14;
            expect(beans.getPageNumber(options)).toEqual(2);
        });

        it("should use maxQueryResult as page length by default", function(){
            beans.offset = 14;
            expect(beans.getPageNumber({})).toEqual(7);
        });
    });

    it("should append records for page +n", function() {
        app.config.maxQueryResult = 1;

        var moduleName = "Contacts", beans, contacts, syncSpy, subSetContacts, server;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        beans = dm.createBeanCollection(moduleName);

        contacts = SugarTest.loadFixture("contacts");
        subSetContacts = contacts;
        subSetContacts.next_offset = 1;
        subSetContacts.result_count = 1;
        subSetContacts.records.pop();

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/Contacts\?max_num=1/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(subSetContacts)]);
        syncSpy = sinon.spy(beans, "fetch");
        beans.fetch();

        SugarTest.server.respond();
        SugarTest.server.restore();
        contacts = SugarTest.loadFixture("contacts");

        contacts.records.shift();
        server = sinon.fakeServer.create();

        server.respondWith("GET", /.*\/rest\/v10\/Contacts\?offset=1&max_num=1/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(contacts)]);

        beans.paginate({add: true});
        server.respond();

        expect(beans.models.length).toEqual(2);
    });

    it("should get records by order by", function() {
        app.config.maxQueryResult = 1;
        var ajaxSpy = sinon.spy($, 'ajax'),
            moduleName = "Contacts", beans, contacts, subSetContacts;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        beans = dm.createBeanCollection(moduleName);

        contacts = SugarTest.loadFixture("contacts");
        subSetContacts = contacts;
        beans.orderBy = {
            field: "bob",
            direction: "asc"
        };

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/Contacts\?max_num=1&orderBy=bob%3Aasc/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(subSetContacts)]);
        beans.fetch();
        SugarTest.server.respond();
        expect(ajaxSpy.getCall(1).args[0].url).toMatch(/.*\/rest\/v10\/Contacts\?max_num=1&order_by=bob%3Aasc/);
        ajaxSpy.restore();
    });

    it("should get records assigned to me", function() {
        app.config.maxQueryResult = 1;
        var ajaxSpy = sinon.spy($, 'ajax'),
            moduleName = "Contacts", beans, contacts;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        beans = dm.createBeanCollection(moduleName);

        contacts = SugarTest.loadFixture("contacts");

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/Contacts\?max_num=1&my_items=1/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(contacts)]);
        beans.fetch({
            myItems: true
        });
        SugarTest.server.respond();
        expect(ajaxSpy.getCall(1).args[0].url).toMatch(/.*\/rest\/v10\/Contacts\?max_num=1&my_items=1/);
        ajaxSpy.restore();
    });

    it("should get records marked as favorites", function() {
        app.config.maxQueryResult = 1;
        var ajaxSpy = sinon.spy($, 'ajax'),
            moduleName = "Contacts", beans, contacts;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        beans = dm.createBeanCollection(moduleName);

        contacts = SugarTest.loadFixture("contacts");

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/Contacts\?max_num=1&favorites=1/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(contacts)]);
        beans.fetch({
            favorites: true
        });
        SugarTest.server.respond();
        expect(ajaxSpy.getCall(1).args[0].url).toMatch(/.*\/rest\/v10\/Contacts\?max_num=1&favorites=1/);
        ajaxSpy.restore();
    });

    it("should get records by search query", function() {
        app.config.maxQueryResult = 1;
        var ajaxSpy = sinon.spy($, 'ajax'),
            moduleName = "Contacts", beans, contacts;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        beans = dm.createBeanCollection(moduleName);

        contacts = SugarTest.loadFixture("contacts");

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/search\?max_num=1&q=Pupochkin&module_list=Contacts$/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(contacts)]);
        beans.fetch({
            query: "Pupochkin"
        });
        SugarTest.server.respond();
        expect(ajaxSpy.getCall(1).args[0].url).toMatch(/.*\/rest\/v10\/search\?max_num=1&q=Pupochkin&module_list=Contacts$/);
        expect(beans.at(0).searchInfo).toBeDefined();
        expect(beans.at(0).searchInfo.highlighted).toBeDefined();
        expect(beans.at(0).searchInfo.score).toBeDefined();
        ajaxSpy.restore();
    });

    it("should get the current page number", function() {
        app.config.maxQueryResult = 1;

        var moduleName = "Contacts", beans, p;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        beans = dm.createBeanCollection(moduleName);

        beans.offset = 3;
        app.config.maxQueryResult = 2;

        p = beans.getPageNumber();
        expect(p).toEqual(2);
    });
    it("should be able to reset pagination", function() {
        app.config.maxQueryResult = 1;

        var moduleName = "Contacts", beans;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        beans = dm.createBeanCollection(moduleName);

        beans.offset = 3;
        app.config.maxQueryResult = 2;

        beans.resetPagination();
        expect(beans.offset).toEqual(0);
        expect(beans.getPageNumber()).toEqual(1);
        expect(beans.next_offset).toEqual(0);
    });

    it("should keep track of fields when paginating", function() {
        var bean, beans, stub, firstCallArgs, secondCallArgs;
        dm.declareModel("Contacts", metadata.modules["Contacts"]);

        bean  = dm.createBean("Contacts");
        beans = dm.createBeanCollection("Contacts");
        stub   = sinon.stub(beans, 'fetch');
        beans.fetch({fields:['a','b','c']});

        beans.paginate();
        firstCallArgs = stub.getCall(0).args[0];
        expect(firstCallArgs.fields).toEqual(['a','b','c']);
        secondCallArgs = stub.getCall(1).args[0];
        expect(secondCallArgs.offset).toEqual(0);
        expect(secondCallArgs.page).toEqual(0);
        beans.fetch.restore();
    });

    it("should get records by filter", function() {
        app.config.maxQueryResult = 1;
        var ajaxSpy = sinon.spy($, 'ajax'),
            moduleName = "Contacts",
            collection, contacts, filterDef, filterUrl;

        dm.declareModel(moduleName, metadata.modules[moduleName]);

        collection = dm.createBeanCollection("Contacts"),
        contacts = SugarTest.loadFixture("contacts"),
        filterDef = {
            "filter": [
                {"name": {"$starts": "J"}}
            ]
        };

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/Contacts\/filter\?max_num=1&filter%5B0%5D%5Bname%5D%5B%24starts%5D=J/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(contacts)]);

        // pass in filter obj
        collection.fetch({
            filter: filterDef
        });
        SugarTest.server.respond();

        expect(ajaxSpy.getCall(1).args[0].url).toMatch(/.*\/rest\/v10\/Contacts\/filter\?max_num=1&filter%5B0%5D%5Bname%5D%5B%24starts%5D=J/);
        ajaxSpy.restore();
    });

    it("should generate a valid filter query", function() {
        app.config.maxQueryResult = 1;
        var ajaxSpy = sinon.spy($, 'ajax'),
            moduleName = "Contacts",
            collection, contacts, filterDef, filterUrl;

        dm.declareModel(moduleName, metadata.modules[moduleName]);

        collection = dm.createBeanCollection("Contacts"),
        contacts = SugarTest.loadFixture("contacts"),
        filterDef = {
            "$owner": ""
        };

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/Contacts\/filter\?max_num=1&filter%5B0%5D%5B%24owner%5D\=/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(contacts)]);

        // pass in filter obj
        collection.fetch({
            filter: filterDef
        });
        SugarTest.server.respond();

        expect(ajaxSpy.getCall(1).args[0].url).toMatch(/.*\/rest\/v10\/Contacts\/filter\?max_num=1&filter%5B0%5D%5B%24owner%5D\=/);
        ajaxSpy.restore();
    });

    it("should should preserve orderBy when filtering", function() {
        app.config.maxQueryResult = 1;
        var ajaxSpy = sinon.spy($, 'ajax'),
            moduleName = "Contacts",
            collection, contacts, filterDef, filterUrl;

        dm.declareModel(moduleName, metadata.modules[moduleName]);

        collection = dm.createBeanCollection("Contacts");
        contacts = SugarTest.loadFixture("contacts");
        filterDef = {
            "filter": {
                "name": {"$starts": "J"}
            }
        };

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/Contacts\/filter\?max_num=1&order_by=name%3Adesc&filter%5B0%5D%5Bname%5D%5B%24starts%5D=J/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(contacts)]);

        // first do a fetch, specifying orderBy
        collection.orderBy = {
            field: "name",
            direction: "desc"
        };
        collection.fetch();

        // then do a fetch, this time passing in the filter object
        collection.fetch({
            filter: filterDef
        });
        SugarTest.server.respond();

        expect(ajaxSpy.getCall(2).args[0].url).toMatch(/.*\/rest\/v10\/Contacts\/filter\?max_num=1&order_by=name%3Adesc&filter%5B0%5D%5Bname%5D%5B%24starts%5D=J/);

        ajaxSpy.restore();
    });

    it("should preserve previous options states when fetching", function() {
        var collection,
            options = {
                relate: true,
                fields: ["name"]
            },
            stub = sinon.stub(Backbone.Collection.prototype, "fetch"),
            args;

        dm.declareModel("Contacts", metadata.modules["Contacts"]);
        collection = dm.createBeanCollection("Contacts");

        // Initial Fetch
        collection.fetch(options);
        args = stub.args[0][0];
        expect(stub.calledOnce).toBeTruthy();
        expect(args.relate).toBeTruthy();
        expect(args.fields).toEqual(["name"]);

        // Fetch with no options, options should still be preserved
        collection.fetch();
        args = stub.args[1][0];
        expect(stub.calledTwice).toBeTruthy();
        expect(args.relate).toBeTruthy();
        expect(args.fields).toEqual(["name"]);

        stub.restore();
    });
});
