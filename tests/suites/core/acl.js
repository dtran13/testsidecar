describe("ACLs", function() {
    var app, model, copiedUser, dm;

    beforeEach(function() {
        SugarTest.seedMetadata(true);
        app = SUGAR.App;
        copiedUser = app.user.toJSON(); // save original to reset on teardown
        app.user.set(fixtures.user);
        model = app.data.createBean("Contacts", {id: "1234", assigned_user_id: 'seed_sally_id' });
        model.set('_acl', {"fields":{"email":{"write":"no", "create":"no"}}});
        app.user.id = "seed_sally_id";
        dm = app.data;
        app.config.maxQueryResult = 2;
        dm.reset();
    });
    
    afterEach(function() {
        app.user.set(copiedUser);
    });

    it("should check for module access at all", function() {
        expect(app.acl.hasAccess("delete", "noAccessModule")).toBeFalsy();
    });

    it("should check for module view/edit access", function() {
        expect(app.acl.hasAccess("edit", "Cases")).toBeTruthy();
    });

    it("should return true if not acls for view are defined", function() {
        expect(app.acl.hasAccess("thisActionHasNoACLs", "Cases")).toBeTruthy();
    });

    it("should return true if no field acl is specified", function() {
        expect(app.acl.hasAccessToModel("edit", model, 'thisfieldhasnospecificACLs')).toBeTruthy();
        expect(app.acl.hasAccessToModel("thisActionHasNoACLs", model, 'email')).toBeTruthy();
    });

    it("should check access to fields for read, edit", function() {
        expect(app.acl.hasAccessToModel("edit", model, "email")).toBeFalsy();
    });

    it("should check access to fields for create", function() {
        expect(app.acl.hasAccessToModel("create", model, "email")).toBeFalsy();
    });

    it("should check access to fields in a group for read, edit", function() {
        expect(app.acl.hasAccessToModel("view", model, "address_street")).toBeTruthy();
        expect(app.acl.hasAccessToModel("view", model, "address_state")).toBeTruthy();
        expect(app.acl.hasAccessToModel("edit", model, "address_street")).toBeFalsy();
        expect(app.acl.hasAccessToModel("edit", model, "address_state")).toBeFalsy();
    });

    it("should check access to fields for owner", function() {
        expect(app.acl.hasAccessToModel("edit", model, "name")).toBeTruthy();

        model.set("assigned_user_id", "seed_sally_bob");
        // we need to change the acl on the record now to reflect the change of ownership 
        model.set('_acl', {"fields":{"name":{"write":"no", "create":"no"}}});
        expect(app.acl.hasAccessToModel("edit", model, "name")).toBeFalsy();
    });

    it("should return true for only admin if you are a module admin", function() {
        expect(app.acl.hasAccess("admin", "Accounts")).toBeTruthy();
        expect(app.acl.hasAccess("admin", "Accounts", "status")).toBeTruthy();
        expect(app.acl.hasAccess("edit", "Accounts")).toBeFalsy();
        expect(app.acl.hasAccess("edit", "Accounts", "status")).toBeFalsy();
    });

    it("should check for module owner access", function() {
        // this now should use hasAccessToModel because we need a specific model passed in
        // no model, all true
        var moduleName = "Cases", cases;
        dm.declareModel(moduleName, app.metadata.getModules[moduleName]);
        
        expect(app.acl.hasAccess("create", "Cases")).toBeTruthy();
        expect(app.acl.hasAccess("list", "Cases")).toBeTruthy();
        expect(app.acl.hasAccess("view", "Cases")).toBeTruthy();
        expect(app.acl.hasAccess("edit", "Cases")).toBeTruthy();
        expect(app.acl.hasAccess("delete", "Cases")).toBeTruthy();

        // owner ID same
        // owner's Case, all true
        cases = dm.createBean("Cases", { "name":"Awesome Sauce", assigned_user_id: 'seed_sally_id', id:"1234"});
        cases.set('_acl', {});
        expect(app.acl.hasAccessToModel("create", cases, null)).toBeTruthy();
        expect(app.acl.hasAccessToModel("list", cases, null)).toBeTruthy();
        expect(app.acl.hasAccessToModel("view", cases, null)).toBeTruthy();
        expect(app.acl.hasAccessToModel("edit", cases, null)).toBeTruthy();
        expect(app.acl.hasAccessToModel("delete", cases, null)).toBeTruthy();

        // owner ID different
        // no access allowed
        cases = dm.createBean("Cases", { "name":"Awesome Sauce", assigned_user_id: 'seed_sally_bob', id:"1234"});
        cases.set('_acl', {"edit":"no","create":"no", "view":"no","delete":"no", "list":"no"});

        expect(app.acl.hasAccessToModel("create", cases, null)).toBeFalsy();
        expect(app.acl.hasAccessToModel("list", cases, null)).toBeFalsy();
        expect(app.acl.hasAccessToModel("view", cases, null)).toBeFalsy();
        expect(app.acl.hasAccessToModel("edit", cases, null)).toBeFalsy();
        expect(app.acl.hasAccessToModel("delete", cases, null)).toBeFalsy();

        // owner ID same
        // Access allowed
        var ownerOnly = dm.createBean("ownerOnly", { "name":"Awesome Sauce", assigned_user_id: 'seed_sally_id', id:"1234"});
        ownerOnly.module = "ownerOnly";
        ownerOnly.set('_acl', {"create":"yes", "view":"yes","delete":"yes", "list":"yes"});

        expect(app.acl.hasAccessToModel("create", ownerOnly, null)).toBeTruthy();
        expect(app.acl.hasAccessToModel("list", ownerOnly, null)).toBeTruthy();
        expect(app.acl.hasAccessToModel("view", ownerOnly, null)).toBeTruthy();
        expect(app.acl.hasAccessToModel("edit", ownerOnly, null)).toBeTruthy();
        expect(app.acl.hasAccessToModel("delete", ownerOnly, null)).toBeTruthy();

        // owner ID different
        // no access allowed
        ownerOnly = dm.createBean("ownerOnly", { "name":"Awesome Sauce", assigned_user_id: 'seed_sally_bob', id:"1234"});
        ownerOnly.module = "ownerOnly";
        ownerOnly.set('_acl', {"edit":"no"});

        expect(app.acl.hasAccessToModel("create", ownerOnly, null)).toBeFalsy();
        expect(app.acl.hasAccessToModel("list", ownerOnly, null)).toBeFalsy();
        expect(app.acl.hasAccessToModel("view", ownerOnly, null)).toBeFalsy();
        expect(app.acl.hasAccessToModel("edit", ownerOnly, null)).toBeFalsy();
        expect(app.acl.hasAccessToModel("delete", ownerOnly, null)).toBeFalsy();

        //// owner ID different, field level only
        // Access allowed
        cases = dm.createBean("Test", { "name":"Awesome Sauce", assigned_user_id: 'seed_sally_id', id:"1234"});
        cases.module = "Test";
        expect(app.acl.hasAccessToModel("create", cases, "name")).toBeTruthy();
        expect(app.acl.hasAccessToModel("list", cases, "name")).toBeTruthy();
        expect(app.acl.hasAccessToModel("view", cases, "name")).toBeTruthy();
        expect(app.acl.hasAccessToModel("edit", cases, "name")).toBeTruthy();

        //// owner ID different, field level only
        // Access allowed
        cases = dm.createBean("Test", { "name":"Awesome Sauce", assigned_user_id: 'seed_sally_bob', id:"1234"});
        cases.module = "Test";
        cases.set('_acl', {
            "fields": {
                "name": {
                    "create": "no",
                    "read": "no",
                    "write": "no"
                }
            }
        });
        expect(app.acl.hasAccessToModel("create", cases, "name")).toBeFalsy();
        expect(app.acl.hasAccessToModel("list", cases, "name")).toBeFalsy();
        expect(app.acl.hasAccessToModel("view", cases, "name")).toBeFalsy();
        expect(app.acl.hasAccessToModel("edit", cases, "name")).toBeFalsy();


    });

    it("should have access to a model when changing the owner, but has not been saved", function() {
        var moduleName = "Contacts", contact;
        dm.declareModel(moduleName, app.metadata.getModules[moduleName]);
        contact = dm.createBean(moduleName, { first_name: "Clara", last_name: "Tsetkin", assigned_user_id: 'seed_sally_id'});
        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("POST", /.*\/rest\/v10\/Contacts.*/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify({ id: "xyz"})]);

        contact.save();
        SugarTest.server.respond();
        var acls = {};
        contact.set('_acl', acls);
        acls.fields = {"name":{"write":"yes","create":"yes"}};
        // ensure we have access as original user
        expect(app.acl.hasAccessToModel("edit", contact, "name")).toBeTruthy();

        //ensure we have access modifying the owner, but before saving
        contact.set("assigned_user_id", "seed_sally_bob");
        expect(app.acl.hasAccessToModel("edit", contact, "name")).toBeTruthy();

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("PUT", /.*\/rest\/v10\/Contacts\/xyz.*/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify({
                    dateModified: "2",
                    _acl:{"fields":{"name":{"write":"no","create":"no"}}}
                })]);

        // ensure we don't have access once the bean is saved and owner is different
        contact.save();
        SugarTest.server.respond();

        expect(app.acl.hasAccessToModel("edit", contact, "name")).toBeFalsy();
    });
});
