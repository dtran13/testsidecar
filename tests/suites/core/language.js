describe("Language Manager", function() {
    var app;

    beforeEach(function() {
        SugarTest.seedMetadata(true);
        app = SugarTest.app;
    });

    it("should retrieve the label from the language string store according to the module and label name", function() {
        var string = app.lang.get("LBL_ASSIGNED_TO_NAME", "Contacts");
        expect(string).toEqual("Assigned to");
        expect(Handlebars.templates["lang.LBL_ASSIGNED_TO_NAME"]).toBeUndefined();
    });

    it("should retrieve the label from app strings if its not set in mod strings", function() {
        var string = app.lang.get("DATA_TYPE_DUE", "Accounts");
        expect(string).toEqual("Due");
    });

    it("should return the input if its not set at all", function() {
        var string = app.lang.get("THIS_LABEL_DOES_NOT_EXIST");
        expect(string).toEqual("THIS_LABEL_DOES_NOT_EXIST");
    });

    it("should return a templated label from the app data", function() {
        var string = app.lang.get("LBL_CREATE", "Accounts", {name: "Account"});
        expect(string).toEqual("Create Account");
        expect(Handlebars.templates["lang.LBL_CREATE"]).toBeDefined();
    });

    it("should return a templated label from the app data without looking at the mod data", function() {
        var string = app.lang.get("LBL_CREATE", null, {name: "Contact"});
        expect(string).toEqual("Create Contact");
    });

    it("should return a templated label from the app data with context equal to 0", function() {
        var string = app.lang.get("ERROR_TEST", null, 0);
        expect(string).toEqual("Some error string 0");
    });

    it("should return a templated label from the mod data and ignore app data", function() {
        var string = app.lang.get("LBL_CREATE", "Contacts", {name: "Contact"});
        expect(string).toEqual("Create a Contact");
    });

    it("should return a label, ignoring the data passed in", function() {
        var string = app.lang.get("LBL_ASSIGNED_TO_NAME", "Contacts", {name: "John Conner"});
        expect(string).toEqual("Assigned to");
    });

    it("should retrieve app string", function() {
        expect(app.lang.getAppString('DATA_TYPE_DUE')).toEqual("Due");
    });

    it("should return key if can't find app strings from key", function() {
        expect(app.lang.getAppString('BOGUS')).toEqual('BOGUS');
    });

    it("should retrieve app list strings as string", function() {
        expect(app.lang.getAppListStrings('case_priority_default_key')).toEqual('P2');
    });

    it("should retrieve app list strings as object", function() {
        expect(app.lang.getAppListStrings('merge_operators_dom')).toEqual(fixtures.metadata.app_list_strings.merge_operators_dom);
    });

    it("should retrieve app list strings as undefined if the key doesn't exist", function() {
        expect(app.lang.getAppListStrings('BOGUS')).toEqual({});
    });

    it("should retrieve the label from the language string store according to the modules passed in as an array and label name", function() {
        var string = app.lang.get("LBL_ASSIGNED_TO_NAME", ["Contacts", "Accounts"]);
        expect(string).toEqual("Assigned to");
        expect(Handlebars.templates["lang.LBL_ASSIGNED_TO_NAME"]).toBeUndefined();
    });

    it("should retrieve the label from app strings if its not set in mod strings for modules passed in as an array", function() {
        var string = app.lang.get("DATA_TYPE_DUE", ["Accounts","Contacts"]);
        expect(string).toEqual("Due");
    });
});

