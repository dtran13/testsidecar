describe("Controller", function() {

    var app;
    beforeEach(function() {
        app = SugarTest.app;
        SugarTest.seedMetadata();
        SugarTest.seedFakeServer();
    });

    describe("whether layout.loadData gets called is controlled by caller using skipFetch", function() {
        
        var params,
            spy,
            stub;

        beforeEach(function() {
            params = {
                module: "Contacts",
                layout: "list"
            };
            // Essentially, we need to spy on whether layout.loadData is called. But the controller 
            // creates this using view mgr's createLayout; so we hijack then set back to original.
            spy = sinon.spy(app.view.Layout.prototype, "loadData");
            stub = sinon.stub(app.view.Layout.prototype, "bindDataChange");

        });
        afterEach(function() {
            spy.restore();
            stub.restore();
        });
        it("should call loadData by default", function() {
            app.controller.loadView(params);
            expect(spy).toHaveBeenCalled();
        });

        it("should NOT call loadData if skipFetch passed", function() {
            params.skipFetch = true;
            app.controller.loadView(params);
            expect(spy).not.toHaveBeenCalled();
        });

    });
    describe("when a route is matched", function() {


        it("should load the view properly", function() {
            var params = {
                    module: "Contacts",
                    layout: "list"
                };

            SugarTest.server.respondWith("GET", /.*\/rest\/v10\/Contacts.*/,
                [200, {  "Content-Type":"application/json"},
                    JSON.stringify(fixtures.api["rest/v10/contact"].GET.response)]);

            app.controller.loadView(params);
            SugarTest.server.respond();

            expect(app.controller.layout).toBeDefined();
            expect(app.controller.layout instanceof Backbone.View).toBeTruthy();
            expect(app.controller.context.get("collection")).toBeDefined();
            expect(app.controller.context.get("collection").models.length).toEqual(2);

        });

        it("should render additional components", function() {
            var components = {login: {target: '#footer'}};
            app.controller.loadAdditionalComponents(components);
            app.controller.loadAdditionalComponents(components); // we should be able to call it multiple times safely
            expect(app.additionalComponents.login instanceof app.view.View).toBeTruthy();
            expect(app.additionalComponents.login.name).toEqual('login');

            //Create additional component as layout
            components = {header: {target: '#footer', layout:'header'}};
            app.controller.loadAdditionalComponents(components);
            expect(app.additionalComponents.header instanceof app.view.Layout).toBeTruthy();
            expect(app.additionalComponents.header.options.name).toEqual('header');

            //Create additional view component with different view name
            components = {login: {target: '#footer', view: 'footer'}};
            app.controller.loadAdditionalComponents(components);
            app.controller.loadAdditionalComponents(components); // we should be able to call it multiple times safely
            expect(app.additionalComponents.login instanceof app.view.View).toBeTruthy();
            expect(app.additionalComponents.login.name).toEqual('footer');
        });

        it('should re-render additional components when app:sync:complete fires', function() {
            var components = {login: {target: '#footer'}};
            app.controller.loadAdditionalComponents(components);
            expect(app.additionalComponents.login instanceof app.view.View).toBeTruthy();
            var renderStub = sinon.stub(app.additionalComponents.login, "render");
            app.router = app.router || {};
            app.router.start = app.router.start || function() {};
            var routerStartStub = sinon.stub(app.router, "start");
            app.events.trigger("app:sync:complete");
            expect(renderStub).toHaveBeenCalled();
            renderStub.restore();
            routerStartStub.restore();
        });
    });
});
