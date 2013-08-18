describe("MixedBeanCollection", function() {
    var metadata, app;

    beforeEach(function() {
        app = SugarTest.app;
        metadata = SugarTest.loadFixture("metadata");
    });

    it("should be able to fetch records that belong to different modules", function() {
        app.config.maxQueryResult = 2;
        app.data.declareModels(metadata.modules);
        var records = app.data.createMixedBeanCollection();

        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/search\?max_num=2&module_list=Accounts%2CContacts.*/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(fixtures.api["rest/v10/search"].GET.response)]);

        records.fetch({
            module_list: ["Accounts","Contacts"]
        });
        SugarTest.server.respond();

        expect(records.module_list).toEqual(["Accounts","Contacts"]);
        expect(records.length).toEqual(2);

        records.each(function(record) {
            expect(record instanceof app.Bean).toBeTruthy();
        });

        expect(records.models[0].module).toEqual("Contacts");
        expect(records.models[1].module).toEqual("Accounts");

    });

    it("should be able to group models by module", function() {

        app.data.declareModels(metadata.modules);
        var records = app.data.createMixedBeanCollection();

        records.add(app.data.createBean("Accounts", { name: "Apple" }));
        records.add(app.data.createBean("Cases", { subject: "A" }));
        records.add(app.data.createBean("Cases", { subject: "B" }));
        records.add(app.data.createBean("Contacts", { name: "John Smith" }));
        records.add(app.data.createBean("Accounts", { name: "Microsoft" }));
        records.add(app.data.createBean("Cases", { subject: "C" }));

        var groups = records.groupByModule();

        expect(groups["Accounts"]).toBeDefined();
        expect(groups["Accounts"].length).toEqual(2);

        expect(groups["Contacts"]).toBeDefined();
        expect(groups["Contacts"].length).toEqual(1);

        expect(groups["Cases"]).toBeDefined();
        expect(groups["Cases"].length).toEqual(3);

    });

});
