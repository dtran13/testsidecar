describe('Plugin Manager', function() {
    var app, meta = fixtures.metadata;

    beforeEach(function() {
        app = SugarTest.app;
        SugarTest.seedMetadata(true);
        app.user.set('module_list', fixtures.metadata.module_list);
    });

    afterEach(function(){
        app.plugins.plugins = {};
    })


    it('should define plugins for views', function() {
        var testPlugin = {foo : "bar"}
        app.plugins.register("test", "view", testPlugin);
        expect(app.plugins._get("test", "view")).toEqual(testPlugin);
    });

    it('should only return plugins valid for a given type', function() {
        var testPlugin = {foo : "bar"}
        app.plugins.register("test", "field", testPlugin);
        expect(app.plugins._get("test", "view")).toEqual(null);
        expect(app.plugins._get("test", "field")).toEqual(testPlugin);
    });

    it('should register plugins for multiple types', function() {
        var testPlugin = {foo : "bar"}
        app.plugins.register("test", ["view", "layout"], testPlugin);
        expect(app.plugins._get("test", "view")).toEqual(testPlugin);
        expect(app.plugins._get("test", "layout")).toEqual(testPlugin);
        expect(app.plugins._get("test", "field")).toEqual(null);
    });

    it('should mix into existing objects', function() {
        var testPlugin = {foo : "bar"};
        var testView = {
            foo : "notBar",
            prop1: "not overriden",
            plugins: ["test"]
        };
        app.plugins.register("test", ["view", "layout"], testPlugin);
        app.plugins.attach(testView, "view");
        expect(testView.foo).toEqual("bar");
        expect(testView.prop1).toEqual("not overriden");
    });

    it('should merge the events list', function() {
        var testPlugin = {
            events : {"click div.test" : "pluginClickCallback"},
            pluginClickCallback : function(){}
        };
        var testView = {
            events : {"click div.somethingElse" : "clickCallback"},
            clickCallback: function(){},
            plugins: ["test"]
        };
        app.plugins.register("test", ["view", "layout"], testPlugin);
        app.plugins.attach(testView, "view");
        expect(testView.events["click div.test"]).toEqual("pluginClickCallback");
        expect(testView.events["click div.somethingElse"]).toEqual("clickCallback");
    });

    it('should call on onAttach callback', function() {
        var testPlugin = {
            plugMix : "Mix a little of this ",
            onAttach : function(){
                this.out = this.plugMix + this.fromView;
            }
        };
        var testView = {
            fromView : "with a little of that.",
            plugins: ["test"]
        };
        sinon.spy(testPlugin, "onAttach");
        app.plugins.register("test", ["view", "layout"], testPlugin);
        app.plugins.attach(testView, "view");
        expect(testPlugin.onAttach).toHaveBeenCalled();
        expect(testView.out).toEqual("Mix a little of this with a little of that.");
    });

    it('should call on onDetach callback when a plugin is disposed', function() {
        var testPlugin = {
            plugMix : "Mix a little of this ",
            onDetach : function(){
                this.out = this.plugMix + this.fromView;
            }
        };
        var testView = {
            fromView : "with a little of that.",
            plugins: ["test"]
        };
        sinon.spy(testPlugin, "onDetach");
        app.plugins.register("test", ["view", "layout"], testPlugin);
        app.plugins.attach(testView, "view");
        app.plugins.detach(testView, "view");
        expect(testPlugin.onDetach).toHaveBeenCalledOnce();
        expect(testView.out).toEqual("Mix a little of this with a little of that.");
    });


});
