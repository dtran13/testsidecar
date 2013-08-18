// ****************************************************************
// *** THIS TEST SUITE ASSUMES THAT THE BROWSER SUPPORTS WEBSQL ***
// ****************************************************************

describe("Offline+DB+server", function() {

    var metadata, origSync, origDb, server,
        app = SUGAR.App,
        odm = app.Offline.dataManager, dm = app.dataManager, spec = this,
        success = function() {
            SugarTest.setWaitFlag();
        },
        error = function() {
            SugarTest.setWaitFlag();
        },
        options = {
            silent: true,
            skipRemoteSync: false,
            success: success,
            error: error
        };

    beforeEach(function() {
        origSync = Backbone.sync;

        app.dataManager.init();
        Backbone.sync = app.Offline.dataManager.sync;
        metadata = SugarTest.loadFixture("things-metadata");

        SugarTest.resetWaitFlag();

        odm.migrate(metadata, {
            callback: function(error) {
                if (error) {
                    spec.fail("Failed to migrate schema: " + error);
                }
                else {
                    app.dataManager.declareModels(metadata);
                    SugarTest.setWaitFlag();
                }
            }
        });

        SugarTest.wait();

        runs(function() {
            SugarTest.resetWaitFlag();
            server = sinon.fakeServer.create();
        });
    });

    afterEach(function() {
        Backbone.sync = origSync;
        server.restore();
    });

    it("should be able to create a bean", function() {
        // Create a new instance of bean "Things"
        var bean = dm.createBean("Things", {
            name: "My thing",
            int_field: 7,
            currency_field: 3.14,
            bool_field: true
        });

        // Fake server responds with pre-cooked response: { id: "xyz" }
        server.respondWith("POST", "/rest/v10/Things",
            [200, {  "Content-Type": "application/json"},
                JSON.stringify({ id: "xyz" })]);

        // User clicks "Save" button
        bean.save(null, options);

        // Tell the server to respond
        _.delay(function() {
            server.respond();
        }, 100);

        // Wait until all operations finish (database + server)
        SugarTest.wait();

        // Check the result
        runs(function() {
            expect(bean.id).toEqual("xyz");
        });

    });

    it("should be able to fetch a bean", function() {

        server.respondWith("GET", "/rest/v10/Things/xyz",
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(
                    {
                        id: "xyz",
                        name: "My thing 2",
                        int_field: 7,
                        currency_field: 3.14,
                        relate_field: "foo",
                        bool_field: false
                    })]);

        var bean = dm.createBean("Things", {id: "xyz"});
        bean.fetch(options);

        _.delay(function() {
            server.respond();
        }, 100);

        SugarTest.wait();

        runs(function() {
            expect(bean.get("name")).toEqual("My thing 2");
        });

    });

    it("should be able to fetch beans from offline storage", function() {
        var opts = _.clone(options), bean, beans;
        opts.skipRemoteSync = true;

        bean = dm.createBean("Things", {
            name: "My thing",
            int_field: 7,
            currency_field: 3.14,
            relate_field: "foo",
            bool_field: true
        });

        bean.save(null, opts);
        SugarTest.wait();

        runs(function() {
            SugarTest.resetWaitFlag();
            bean = dm.createBean("Things", {
                name: "My thing 2",
                int_field: 8,
                currency_field: 4.14,
                relate_field: "bar",
                bool_field: false
            });
            bean.save(null, opts);
        });

        SugarTest.wait();

        runs(function() {
            SugarTest.resetWaitFlag();
            beans = dm.createBeanCollection("Things");
            beans.fetch(opts);
        });

        SugarTest.wait();

        runs(function() {
            expect(beans.length).toEqual(2);
            expect(beans.at(0).get("name")).toEqual("My thing");
            expect(beans.at(1).get("name")).toEqual("My thing 2");
        });

    });


});
