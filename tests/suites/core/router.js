describe("Router", function() {
    var app, router, defaultModule, navigateStub;

    beforeEach(function() {
        app = SugarTest.app;
        defaultModule = app.config.defaultModule;
        navigateStub = sinon.stub(app.Router.prototype, 'navigate');
        app.routing.start();
        router = app.router;
    });

    afterEach(function() {
        app.config.defaultModule = defaultModule;
        app.router = null;
        navigateStub.restore();
    });

    it("should build a route given a model", function(){
        var route,
            model = new Backbone.Model(),
            action = "edit";

        model.set("id", "1234");
        model.module = "Contacts";

        route = router.buildRoute(model.module, model.id, action);

        expect(route).toEqual("Contacts/1234/edit");
    });

    it("should build a route given a context", function(){
        var route,
            context = { get: function() { return "Contacts"; }},
            action = "create";

        route = router.buildRoute(context, null, action);

        expect(route).toEqual("Contacts/create");
    });

    it("should handle index route with default module", function() {
        app.config.defaultModule = "Cases";

        router.index();
        expect(navigateStub.calledWith(app.config.defaultModule, {trigger:true})).toBeTruthy();
    });

    it("should handle index route with unspecified default module", function() {
        app.config.defaultModule = null;

        router.index();
        expect(navigateStub.calledWith('Home', {trigger:true})).toBeTruthy();
    });

    it("should handle arbitrary layout route", function() {
        var mock = sinon.mock(app.controller);
        mock.expects("loadView").once().withArgs({
            module:'Cases',
            layout:'list'
        });

        router.layout('Cases', 'list');
        expect(mock.verify()).toBeTruthy();
    });

    it("should handle create route", function() {
        var mock = sinon.mock(app.controller);
        mock.expects("loadView").once().withArgs({
            module: 'Cases',
            create: true,
            layout: 'edit'
        });

        router.create('Cases');
        expect(mock.verify()).toBeTruthy();
    });

    it("should handle record route", function() {
        var mock = sinon.mock(app.controller);
        mock.expects("loadView").once().withArgs({
            module: 'Cases',
            modelId: 123,
            action: 'edit',
            layout: 'record'
        });

        router.record('Cases', 123, 'edit');
        expect(mock.verify()).toBeTruthy();
    });

    it("should handle login route", function() {
        var mock = sinon.mock(app.controller);
        mock.expects("loadView").once().withArgs({
            module:'Login',
            layout:'login',
            create: true
        });

        router.login();
        expect(mock.verify()).toBeTruthy();
    });

    it("should handle logout route", function() {
        var mock = sinon.mock(app.api);
        mock.expects("logout").once();

        router.logout();
        expect(mock.verify()).toBeTruthy();
    });

    it("should reject a secure route if the user is not authenticated", function() {
        var stub = sinon.stub(app.api, "isAuthenticated", function() { return false; });
        var beforeRouting = app.routing.beforeRoute("index");
        expect(beforeRouting).toBeFalsy();
        stub.restore();
    });

    it("should reject a secure route if the app is not synced", function() {
        app.isSynced = false;
        var beforeRouting = app.routing.beforeRoute("index");
        expect(beforeRouting).toBeFalsy();
    });

    it("should always accept an unsecure route", function() {
        var beforeRouting = app.routing.beforeRoute("signup");
        expect(beforeRouting).toBeTruthy();
    });

    it("should call a route handler and routing.after if routing.before returns true", function() {
        sinon.stub(app.routing, "beforeRoute", function() { return true; });
        var stub = sinon.stub(app.routing, "after");
        var stub2 = sinon.stub(app.router, "index");

        app.router._routeHandler(app.router.index);
        expect(stub).toHaveBeenCalled();
        expect(stub2).toHaveBeenCalled();
        app.routing.beforeRoute.restore();
        app.routing.after.restore();
        app.router.index.restore();
    });

    it("should not call a route handler and routing.after if routing.before returns false", function() {
        sinon.stub(app.routing, "beforeRoute", function() { return false; });
        var spy = sinon.spy(app.routing, "after");
        var spy2 = sinon.spy(app.router, "index");

        app.router._routeHandler(app.router.index);
        expect(spy).not.toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
        app.routing.beforeRoute.restore();
        app.routing.after.restore();
        app.router.index.restore();
    });

    // TODO: This test has been disabled, as the paramters don't work properly. Need to add supporting routes
    xit("should add params to a route if given in options ", function(){
        var route,
            context = {},
            options = {
                module: "Contacts",
                params: [
                    {name: "first", value: "Rick"},
                    {name: "last", value: "Astley"},
                    {name: "job", value: "Rock Star"}
                ]
            },
            action = "create";

        route = router.buildRoute(context, action, {}, options);

        expect(route).toEqual("Contacts/create?first=Rick&last=Astley&job=Rock+Star");
    });

    it("should should trigger before event before routing", function() {
        var callback = sinon.stub(),
            route = "Accounts",
            args = {id:"1234"};

        app.routing.before("route", callback);
        app.routing.beforeRoute(route, args);
        expect(callback).toHaveBeenCalledWith({route:route, args:args});
        app.routing.offBefore("route", callback);
    });

    it("should not navigate when callback return false", function() {
        var callback = sinon.stub().returns(false),
            route = app.config.unsecureRoutes[0],
            args = {id:"1234"};

        expect(app.routing.beforeRoute(route, args)).toBeTruthy();
        app.routing.before("route", callback);
        expect(app.routing.beforeRoute(route, args)).toBeFalsy();
        app.routing.offBefore("route", callback);
    });

    it("should trigger load view with the same arguments when refresh is called", function() {
        var mock = sinon.mock(Backbone.history);
        var frag = Backbone.history.fragment;
            Backbone.history.fragment = "Cases/layout/list";

        mock.expects("loadUrl").once().withArgs(Backbone.history.fragment);

        router.refresh();

        expect(mock.verify()).toBeTruthy();

        Backbone.history.fragment = frag;
        mock.restore();
    });
});
