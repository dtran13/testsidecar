describe("Bean", function() {

    var app, dm, metadata;



    beforeEach(function() {
        app = SugarTest.app;
        SugarTest.seedMetadata();
        dm = SugarTest.dm;
        metadata = SugarTest.metadata;
        SugarTest.seedFakeServer();
    });
    it("should set previous attributes", function() {
        dm.declareModel("Cases", metadata.modules["Cases"]);
        var bean = app.data.createBean("Cases");
        var attributes = {
            id: '1234',
            name: 'test'
        }
        bean._setSyncedAttributes(attributes);

        expect(bean.getSyncedAttributes()).toEqual(attributes);
    });
    it("should set previous attributes on sync", function() {
        dm.declareModel("Cases", metadata.modules["Cases"]);
        var bean = app.data.createBean("Cases");
        var attributes = {
            id: '1234',
            name: 'test'
        }
        bean.set({id:'1234'});
        var server = SugarTest.server;
        server.respondWith("GET", /.*\/rest\/v10\/Cases.*/,
            [200, {"Content-Type": "application/json"},
                JSON.stringify(attributes)]);
        bean.fetch();
        server.respond();

        expect(bean.getSyncedAttributes()).toEqual(attributes);
    });
    it("should be able to reset attributes to previous attributes", function() {
        dm.declareModel("Cases", metadata.modules["Cases"]);
        var bean = app.data.createBean("Cases");
        var attributes = {
            id: '1234',
            name: 'test'
        };

        var changedAttributes = {
            id: '5123',
            name: 'notTest'
        };

        var partialChange = {
            name: 'anotherChange'
        };

        var partiallyChangedAttributes = {
            id: '1234',
            name: 'anotherChange'
        };
        bean._setSyncedAttributes(attributes);
        expect(bean.getSyncedAttributes()).toEqual(attributes);
        bean.set(changedAttributes);
        expect(bean.attributes).toEqual(changedAttributes);
        bean.revertAttributes();
        expect(bean.attributes).toEqual(attributes);

        bean.set(partialChange);
        expect(bean.attributes).toEqual(partiallyChangedAttributes);
        bean.revertAttributes();
        expect(bean.attributes).toEqual(attributes);

        bean.set(partialChange);
        expect(bean.attributes).toEqual(partiallyChangedAttributes);
        bean.set(changedAttributes);
        expect(bean.attributes).toEqual(changedAttributes);
        bean.revertAttributes();
        expect(bean.attributes).toEqual(attributes);

    });
    it("should be able to copy all fields from another bean", function() {
        dm.declareModel("Cases", metadata.modules["Cases"]);
        var source = app.data.createBean("Cases", {
            id: "123",
            case_number: "555",
            account_id: "zxc",
            account_name: "Account X",
            email: {
                email1: "blah@example.com",
                email2: "blah-blah@example.com"
            }
        });

        var bean = app.data.createBean("Cases");
        bean.copy(source);

        expect(bean.id).toBeUndefined();
        expect(bean.has("case_number")).toBeFalsy();
        expect(bean.get("account_id")).toEqual("zxc");
        expect(bean.get("account_name")).toEqual("Account X");
        expect(bean.get("email")).toBeDefined();
        expect(bean.get("email").email1).toEqual("blah@example.com");
        expect(bean.get("email").email2).toEqual("blah-blah@example.com");

        // Modify the copy and make sure the source is not affected
        var email = bean.get("email");
        email.email1 = "x@example.com";
        email.email2 = "y@example.com";
        expect(source.get("email").email1).toEqual("blah@example.com");
        expect(source.get("email").email2).toEqual("blah-blah@example.com");
    });

    it("should be able to copy specified fields from another bean", function() {
        dm.declareModel("Cases", metadata.modules["Cases"]);
        var source = app.data.createBean("Cases", {
            id: "123",
            case_number: "555",
            account_id: "zxc",
            account_name: "Account X"
        });

        var bean = app.data.createBean("Cases");
        bean.copy(source, ["case_number", "account_name"]);

        expect(bean.id).toBeUndefined();
        expect(bean.has("case_number")).toBeFalsy();
        expect(bean.has("account_id")).toBeFalsy();
        expect(bean.get("account_name")).toEqual("Account X");
    });

    it("should be able to avoid copying fields that are forbidden by metadata", function() {
        dm.declareModel('Accounts', app.metadata['Accounts']);
        var source = app.data.createBean('Accounts', {
            id: '123', // this shouldn't be copied
            assigned_user_id: '34456', // this should be copied
            date_created: '2013-05-01T00:10:00+00:00' // this should not be copied
        });

        var bean = app.data.createBean('Accounts');
        bean.copy(source);

        expect(bean.id).toBeUndefined();
        expect(bean.get('assigned_user_id')).toEqual('34456');
        expect(bean.has('date_created')).toBeFalsy();
    });

    it("should be able to validate, when value is '0' ", function() {
        var moduleName = "Cases", bean, error, errors, stub;

        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName, { case_number: 0});
        bean.fields.case_number.min = 66;

        stub = sinon.stub();
        runs(function() {
            bean._doValidate(bean.fields, {}, stub);
        });
        waitsFor(function() {
            return stub.called;
        });
        runs(function() {
            errors = stub.lastCall.args[2];
            expect(errors).toBeDefined();

            error = errors["case_number"];
            expect(error).toBeDefined();
            expect(error.minValue).toEqual(66);
        });
    });

    it("should be able to validate itself", function() {
        var moduleName = "Opportunities", bean, error, errors, stub, spy;

        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName, { account_name: "Super long account name"});

        stub = sinon.stub();
        runs(function() {
            bean._doValidate(bean.fields, {}, stub);
        });
        waitsFor(function() {
            return stub.called;
        });
        runs(function() {
            errors = stub.lastCall.args[2];
            expect(errors).toBeDefined();

            error = errors["account_name"];
            expect(error).toBeDefined();
            expect(error.maxLength).toEqual(20);

            error = errors["name"];
            expect(error).toBeDefined();
            expect(error.required).toBeTruthy();
        });
        runs(function() {
            stub.reset();
            spy = sinon.spy();
            bean.on("error:validation:account_name", spy);
            bean.on("error:validation:name", spy);
            bean.doValidate(null, stub);
        });
        waitsFor(function() {
           return stub.called;
        });
        runs(function() {
            var isValid = stub.lastCall.args[0];
            expect(isValid).toBeFalsy();
            expect(spy).toHaveBeenCalledTwice();
        });

        // Check the optional fields param as object
        runs(function() {
            stub.reset();
            bean._doValidate({
                account_name: bean.fields["account_name"]
            }, {}, stub);
        });
        waitsFor(function() {
           return stub.called;
        });
        runs(function() {
            errors = stub.lastCall.args[2];
            expect(errors).toBeDefined();
            expect(errors["account_name"]).toBeDefined();
            expect(errors["name"]).toBeUndefined();
        });
        // Check the optional fields param as array
        runs(function() {
            stub.reset();
            bean._doValidate(["account_name"], {}, stub);
        });
        waitsFor(function() {
           return stub.called;
        });
        runs(function() {
            errors = stub.lastCall.args[2];
            expect(errors).toBeDefined();
            expect(errors["account_name"]).toBeDefined();
            expect(errors["name"]).toBeUndefined();
        });
    });


    it("should be able to add validation tasks", function() {
        var moduleName = "Opportunities", bean, stub, task1, task2,
            test1 = false,
            test2 = true;

        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName, { account_name: "Super long account name"});

        stub = sinon.stub();
        task1 = function(fields, errors, callback) {
            test1 = true;
            callback(null, fields, errors);
        };
        task2 = function(fields, errors, callback) {
            test2 = false;
            callback(null, fields, errors);
        };
        runs(function() {
            bean.addValidationTask('test1', task1);
            bean.addValidationTask('test2', task2);
            bean.doValidate(null, stub);
        });
        waitsFor(function() {
           return stub.called;
        });
        runs(function() {
            expect(test1).toBeTruthy();
            expect(test2).toBeFalsy();
        });
    });

    it("should trigger a 'validation:success' before the 'validation:complete' event on a valid bean", function(){
        var moduleName = "Contacts", bean, stub, triggerStub;
        bean = dm.createBean(moduleName);
        stub = sinon.stub();
        triggerStub = sinon.stub(bean, "trigger", function(event){
            if(triggerStub.calledOnce){
                expect(event).toEqual("validation:success");
            } else {
                expect(event).toEqual("validation:complete");
            }
        });
        runs(function(){
            bean.doValidate(null, stub);
        });
        waitsFor(function() { return stub.called; });
        runs(function(){
            expect(triggerStub.calledTwice).toBeTruthy();
            triggerStub.restore();
        });
    });

    it("should trigger a 'validation:complete' event even on invalid bean", function(){
        var moduleName = "Contacts", bean, stub, triggerStub;
        bean = dm.createBean(moduleName);
        bean.fields = {field: {required: true, name: 'field'}};
        bean.set("field", "");
        stub = sinon.stub();
        triggerStub = sinon.stub(bean, "trigger", function(event){
            expect(event === "error:validation:field" || event === "error:validation" || event === "validation:complete").toBeTruthy();
        });
        expect(triggerStub).not.toHaveBeenCalled();
        runs(function(){
            bean.doValidate(null, stub);
        });
        waitsFor(function() { return stub.called; });
        runs(function(){
            expect(triggerStub.calledThrice).toBeTruthy();
            expect(triggerStub.thirdCall.args[0]).toEqual("validation:complete");
            triggerStub.restore();
            expect(0).toEqual(0);
        });
    });

    it("should be populated with defaults upon instantiation", function() {
        var moduleName = "Contacts", bean;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName, { first_name: "John" });
        expect(bean.get("field_0")).toEqual(100);
        expect(bean.get("first_name")).toEqual("John");
    });

    it("should not be populated with defaults upon instantiation if the model exists", function() {
        var moduleName = "Contacts", bean;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName, { id: "xyz ", first_name: "John" });
        expect(bean.has("field_0")).toBeFalsy();
        expect(bean.get("first_name")).toEqual("John");
    });

    it("should be able to create a collection of related beans", function() {
        dm.declareModels(metadata.modules);
        var opportunity = dm.createBean("Opportunities");
        opportunity.id = "opp-1";

        var contacts = opportunity.getRelatedCollection("contacts");

        expect(contacts.module).toEqual("Contacts");
        expect(contacts.link).toBeDefined();
        expect(contacts.link.name).toEqual("contacts");
        expect(contacts.link.bean).toEqual(opportunity);
        expect(opportunity._relatedCollections["contacts"]).toEqual(contacts);

        // Make sure we get the same instance (cached)
        expect(opportunity.getRelatedCollection("contacts")).toEqual(contacts);
    });

    it("should skip validation upon save if fieldsToValidate param is not specified", function() {
        var moduleName = "Contacts", bean;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName);

        var stub = sinon.stub(Backbone.Model.prototype, 'save');
        var mock = sinon.mock(bean);
        mock.expects("doValidate").never();

        bean.save();
        mock.verify();
        stub.restore();
    });

    it("should not skip validation upon save if fieldsToValidate param is specified", function() {
        var moduleName = "Contacts", bean;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName);

        var stub = sinon.stub(Backbone.Model.prototype, 'save');
        var mock = sinon.mock(bean);
        mock.expects("doValidate").once();

        bean.save(null, { fieldsToValidate: bean.fields });
        mock.verify();
        stub.restore();
    });

    it("should be able to check if it can have attachments", function() {
        var moduleName = "Contacts", bean;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName);

        expect(bean.canHaveAttachments()).toBeFalsy();

        moduleName = "KBDocuments";
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName);

        expect(bean.canHaveAttachments()).toBeTruthy();
    });

    it("should be able to fetch file list", function() {
        var moduleName = "KBDocuments", bean;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName, {id: "123"});

        var mock = sinon.mock(app.api);

        mock.expects("file").once().withArgs("read", {
            module: "KBDocuments",
            id: "123"
        });
        bean.getFiles();

        mock.verify();
    });

    it("should be able to mark itself as favorite", function() {
        var moduleName = "Contacts", bean;
        dm.declareModel(moduleName, metadata.modules[moduleName]);
        bean = dm.createBean(moduleName, {id: "123", my_favorite: false});
        expect(bean.isFavorite()).toBeFalsy();

        var mock = sinon.mock(app.api);

        mock.expects("favorite").once().withArgs("Contacts", "123", true);
        bean.favorite(true);
        mock.verify();
        expect(bean.isFavorite()).toBeTruthy();

        mock = sinon.mock(app.api);
        mock.expects("favorite").once().withArgs("Contacts", "123", false);
        bean.favorite(false);
        mock.verify();
        expect(bean.isFavorite()).toBeFalsy();
    });


});
