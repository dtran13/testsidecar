describe("App", function() {
    var app, server;
    // TODO: Refactor this test suite. It has lots of code duplication

    beforeEach(function() {
        SugarTest.seedFakeServer();
        app = SugarTest.app;
        server = SugarTest.server;
    });

    afterEach(function() {

    });

    it("should return an existing instance", function() {
        // The way app.init is designed is incorrect in my opinion
        // So we shouldn't be calling app.init multiple times
        var app2 = SUGAR.App.init({el: "body"});
        expect(app2).toEqual(app);
    });

    it("should be able to register a module", function() {
        var mock,
            module = {
                init: function() {
                }
            };
        mock = sinon.mock(module);

        mock.expects("init").once();
        app.augment("test", module, true);

        expect(mock.verify()).toBeTruthy();
    });

    it("should fire a sync:complete event when all of the sync jobs have finished", function() {
        var spy = sinon.spy();
        var complete = function() {
            SugarTest.setWaitFlag();
        };
        var mstub = sinon.stub(app.user, "load", function(callback) { callback(); });
        var stub = sinon.stub(app.metadata, "sync", function(callback) { callback(); });
        app.router = {
            start: sinon.stub()
        };

        app.on("app:sync:complete", spy);

        app.sync({callback: complete});

        SugarTest.wait();

        runs(function() {
            expect(spy).toHaveBeenCalled();
            expect(mstub).toHaveBeenCalled();
            expect(app.router.start).toHaveBeenCalled();
            stub.restore();
            mstub.restore();
            app.off("app:sync:complete", spy);
            delete app.router;
        });
    });

    it("should fire a sync:error event when one of the sync jobs have failed", function() {
        var spy = sinon.spy();
        var complete = function() {
            SugarTest.setWaitFlag();
        };

        var mstub = sinon.stub(app.metadata, "sync", function(callback) { callback(); });
        var stub = sinon.stub(app.user, "load", function(callback) {
            callback("Error!");
        });

        app.on("app:sync:error", spy);

        app.sync({callback: complete});

        SugarTest.wait();

        runs(function() {
            expect(spy).toHaveBeenCalled();
            expect(mstub).not.toHaveBeenCalled();//Now after meta.sync in waterfall
            stub.restore();
            mstub.restore();
            app.off("app:sync:error", spy);
        });
    });


    it('should navigate given context, model and action', function() {
        var model = new Backbone.Model(),
            mock,
            action = "edit",
            options = {},
            context = app.context.getContext();

        app.router = {
            buildRoute: function() {},
            navigate: function() {}
        };

        mock = sinon.mock(app.router);
        model.set("id", "1234");
        model.module = "Contacts";
        context.set("model", model);

        mock.expects("buildRoute").withArgs("Contacts", "1234", "edit");
        mock.expects("navigate").once();

        app.navigate(context, model, action, options);

        mock.verify();
        delete app.router;
    });

    it("should login", function() {

        var loginResponse = fixtures.api["/rest/v10/oauth2/token"].POST.response;

        var server = SugarTest.server;
        server.respondWith("POST", /.*\/rest\/v10\/oauth2\/token.*/,
            [200, {"Content-Type": "application/json"},
                JSON.stringify(loginResponse)]);

        var loginSpy = sinon.spy(app.api, "login");
        var appSpy = sinon.spy(app, "trigger");
        var syncStub = sinon.stub(app, "sync");
        var callbackSpy = sinon.spy(function(loginData) {});
        var completeSpy = sinon.spy();
        app.login({user:'dauser',pass:'dapass'}, null, {
            success: callbackSpy,
            complete: completeSpy
        });
        server.respond();

        expect(loginSpy).toHaveBeenCalled();
        expect(appSpy).toHaveBeenCalledWith("app:login:success", loginResponse);
        expect(callbackSpy).toHaveBeenCalledWith(loginResponse);
        expect(completeSpy).toHaveBeenCalled();
        expect(syncStub).toHaveBeenCalled();

        loginSpy.restore();
        appSpy.restore();
        syncStub.restore();
    });

    it("should process error if login fails", function() {
        server.respondWith("POST", /.*\/rest\/v10\/oauth2\/token.*/,
            [401, {"Content-Type": "application/json"},
                JSON.stringify({})]);

        var appSpy = sinon.spy(app, "trigger");
        var callbackSpy = sinon.spy(function(error) {});

        app.login({}, null, {
            error: callbackSpy
        });
        server.respond();

        expect(appSpy).not.toHaveBeenCalled();
        expect(callbackSpy).toHaveBeenCalled();

        appSpy.restore();
    });

    it("should logout", function() {
        var mock        = sinon.mock(app.api),
            successFn   = function() {},
            callbacks   = {success: successFn};

        mock.expects("logout").once().withArgs(callbacks);
        app.logout( callbacks );
        expect(mock.verify()).toBeTruthy();
    });

    it("should run compatibility check simply returning true if no config.minServerVersion is set", function() {
        var serverInfoFixture, compatible;
        app.config.minServerVersion = undefined;
        serverInfoFixture = {}; // meaningless for this test
        compatible = app.isServerCompatible(serverInfoFixture);
        expect(compatible).toEqual(true);
    });

    it("should run compatibility check returning true if server version < config.minServerVersion", function() {
        var serverInfoFixture, compatible;
        app.config.minServerVersion = 6.5; // our fixture is 6.6
        serverInfoFixture = fixtures.metadata.server_info;
        compatible = app.isServerCompatible(serverInfoFixture);
        expect(compatible).toEqual(true);
    });

    it("should run compatibility check returning error object if server version > config.minServerVersion", function() {
        var expectedErrorObject, serverInfoFixture, compatible;
        serverInfoFixture = fixtures.metadata.server_info;
        expectedErrorObject = {
            code: "server_version_incompatible",
            label: "ERR_SERVER_VERSION_INCOMPATIBLE",
            server_info: serverInfoFixture
        };
        app.config.minServerVersion = "6.7";
        compatible = app.isServerCompatible(serverInfoFixture);
        expect(compatible).toEqual(expectedErrorObject);
    });

    it("should run compatibility check returning error object if no data supplied and min version is specified", function() {
        var expectedErrorObject, compatible;
        expectedErrorObject = {
            code: "server_version_incompatible",
            label: "ERR_SERVER_VERSION_INCOMPATIBLE",
            server_info: null
        };
        app.config.minServerVersion = "1.1";
        // Even though minServerVersion < server version ... we sill supply no data thus getting an error object
        compatible = app.isServerCompatible(null);
        expect(compatible).toEqual(expectedErrorObject);
    });

    it("should run compatibility check returning OK if flavor is ENT", function() {
        var serverInfoFixture, compatible;
        serverInfoFixture = fixtures.metadata.server_info;
        app.config.supportedServerFlavors = ["PRO", "ENT", "ULT"];
        app.config.minServerVersion = "6.7";
        compatible = app.isServerCompatible(serverInfoFixture);
        expect(compatible).toBeTruthy();
    });

    it("should run compatibility check returning error if flavor is COM (Community edition)", function() {
        var serverInfoFixture, compatible, expectedErrorObject;
        serverInfoFixture = _.clone(fixtures.metadata.server_info);
        serverInfoFixture.flavor = 'COM'; // Community edition
        app.config.supportedServerFlavors = ["PRO", "ENT", "ULT"];
        expectedErrorObject = {
            code: "server_flavor_incompatible",
            label: "ERR_SERVER_FLAVOR_INCOMPATIBLE",
            server_info: serverInfoFixture
        };
        compatible = app.isServerCompatible(serverInfoFixture);
        expect(compatible).toEqual(expectedErrorObject);
    });

    it("should run compatibility check returning error object if no data supplied and min version and flavors are specified", function() {
        var expectedErrorObject, compatible;
        expectedErrorObject = {
            code: "server_version_incompatible",
            label: "ERR_SERVER_VERSION_INCOMPATIBLE",
            server_info: null
        };
        app.config.minServerVersion = "6.7";
        app.config.supportedServerFlavors = ["PRO", "ENT", "ULT"];
        compatible = app.isServerCompatible(null);
        expect(compatible).toEqual(expectedErrorObject);
    });

    it("should run compatibility check returning error object if no data supplied and just flavors are specified", function() {
        var expectedErrorObject, compatible;
        expectedErrorObject = {
            code: "server_flavor_incompatible",
            label: "ERR_SERVER_FLAVOR_INCOMPATIBLE",
            server_info: null
        };
        app.config.minServerVersion = null;
        app.config.supportedServerFlavors = ["PRO", "ENT", "ULT"];
        compatible = app.isServerCompatible(null);
        expect(compatible).toEqual(expectedErrorObject);
    });

    /**
     * @see core/user.js
     */
    describe("language process", function() {

        var cbSpy, complete, dmstub, sstub, suser, mstub, stub, sauth;

        beforeEach(function() {
            cbSpy = sinon.spy();
            complete = function() {
                SugarTest.setWaitFlag();
            };

            dmstub = sinon.stub(app.data, "declareModels", function() { /* nop */ });
            sstub = sinon.stub(app, "isServerCompatible", function(callback) { callback(); });
            suser = sinon.stub(app.user, "updateLanguage", function(language, callback) {
                callback();
            });
            mstub = sinon.stub(app.user, "load", function(callback) { callback(); });
            stub = sinon.stub(app.metadata, "sync", function(callback) { callback(); });

            app.router = {
                start: sinon.stub()
            };

        });

        afterEach(function() {
            dmstub.restore();
            sauth.restore();
            sstub.restore();
            stub.restore();
            mstub.restore();
            suser.restore();
            app.user.clear();
            delete app.router;
        });

        describe("an authenticated user changes the language", function() {

            beforeEach(function() {
                sauth = sinon.stub(app.api, "isAuthenticated", function() {
                    return true;
                });
            });

            it("should update language on server", function() {

                app.user.setPreference("language", "en_us");
                app.lang.setLanguage("fr_FR", complete);

                SugarTest.wait();

                runs(function() {
                    expect(app.cache.get("lang")).toEqual("fr_FR");
                    expect(app.user.getPreference("language")).toEqual("fr_FR");
                    expect(suser).toHaveBeenCalled();
                    expect(app.router.start).toHaveBeenCalled();
                });
            });

            it("should not update language on server because of noUserUpdate:true", function() {
                app.user.setPreference("language", "en_us");
                app.lang.setLanguage("fr_FR", complete, {noUserUpdate:true});

                SugarTest.wait();

                runs(function() {
                    expect(app.cache.get("lang")).toEqual("fr_FR");
                    expect(app.user.getPreference("language")).toEqual("fr_FR");
                    expect(suser).not.toHaveBeenCalled();
                    expect(app.cache.get("langHasChanged")).toBeFalsy();
                    expect(app.router.start).toHaveBeenCalled();
                });
            });
        });

        describe("a non-authenticated user changes the language", function() {

            var syncPublicStub;

            beforeEach(function() {
                sauth = sinon.stub(app.api, "isAuthenticated", function() {
                    return false;
                });
                syncPublicStub = sinon.stub(app, "syncPublic", function(options) { options.callback(); });
            });
            afterEach(function() {
                syncPublicStub.restore();
            });

            it("should set langHasChanged to true", function() {
                app.user.setPreference("language", "en_us");
                app.lang.setLanguage("fr_fr", complete);

                SugarTest.wait();

                runs(function() {
                    expect(app.cache.get("lang")).toEqual("fr_fr");
                    expect(app.user.getPreference("language")).toEqual("fr_fr");
                    expect(syncPublicStub).toHaveBeenCalled();
                    expect(app.cache.get('langHasChanged')).toBeTruthy();
                });
            });

            it("should update language when the user login", function() {
                app.cache.set('langHasChanged', true);
                app.lang.currentLanguage = "fr_fr";

                app.sync({callback:complete});

                SugarTest.wait();

                runs(function() {
                    expect(suser).toHaveBeenCalled();
                    expect(app.cache.get('langHasChanged')).toBeFalsy();
                    expect(app.router.start).toHaveBeenCalled();
                    app.cache.cut('langHasChanged');
                });
            });
        });
    });

    describe("having config.loadCss set", function() {

        it("should call the CSS Api when the app initializes and call metadata.sync after", function() {

            var cssResponse = fixtures.api["/rest/v10/css"].GET.response;

            var server = SugarTest.server;
            server.respondWith("GET", /.*\/rest\/v10\/css.*/,
                [200, {"Content-Type": "application/json"},
                    JSON.stringify(cssResponse)]);

            var loadCssStub = sinon.stub(app, "loadCss", function(callback) { callback(); });
            var syncStub = sinon.stub(app.metadata, "sync");

            app.config.loadCss = "url";
            app.config.syncConfig = true;
            app._init({el: "body"});
            server.respond();

            expect(loadCssStub).toHaveBeenCalled();
            expect(syncStub).toHaveBeenCalled();

            app.config.loadCss = false;
            app.config.syncConfig = false;
            loadCssStub.restore();
            syncStub.restore();
        });

        it("should call the CSS Api and load the link in the header", function() {

            var cssResponse = fixtures.api["/rest/v10/css"].GET.response;

            var server = SugarTest.server;
            server.respondWith("GET", /.*\/rest\/v10\/css.*/,
                [200, {"Content-Type": "application/json"},
                    JSON.stringify(cssResponse)]);

            var cssSpy = sinon.spy(app.api, "css");
            var syncStub = sinon.stub(app.metadata, "sync");

            app.config.loadCss = "url";
            app.config.syncConfig = false;
            app._init({el: "body"});
            server.respond();

            expect(cssSpy).toHaveBeenCalled();
            expect(syncStub).not.toHaveBeenCalled();

            var linkCss = $('head').children('link:last-child').attr('href').split('?');
            expect(linkCss[0]).toEqual(app.utils.buildUrl(cssResponse.url[0]));
            $('head').children('link:last-child').remove();

            app.config.loadCss = false;
            cssSpy.restore();
            syncStub.restore();
        });

        it("should call the CSS Api and load the css in the header", function() {

            var cssResponse = fixtures.api["/rest/v10/css"].GET.response;

            var server = SugarTest.server;
            server.respondWith("GET", /.*\/rest\/v10\/css.*/,
                [200, {"Content-Type": "application/json"},
                    JSON.stringify(cssResponse)]);

            var cssSpy = sinon.spy(app.api, "css");
            var syncStub = sinon.stub(app.metadata, "sync");

            app.config.loadCss = "text";
            app.config.syncConfig = false;
            app._init({el: "body"});
            server.respond();

            expect(cssSpy).toHaveBeenCalled();
            expect(syncStub).not.toHaveBeenCalled();

            var linkCss = $('head').children('style:last-child').html();
            expect(linkCss).toEqual(cssResponse.text[0]);
            $('head').children('style:last-child').remove();

            app.config.loadCss = false;
            cssSpy.restore();
            syncStub.restore();
        });

    });

});
