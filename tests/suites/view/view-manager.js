describe("View Manager", function() {
    var app, context, ucPlatform;

    beforeEach(function() {
        SugarTest.seedMetadata(true);
        app = SugarTest.app;
        context = app.context.getContext();
        ucPlatform = app.utils.capitalize(app.config.platform);
    });

    afterEach(function() {
        app.view.reset();
        delete app.view.PortalLayout;
        delete app.view.PortalView;
        delete app.view.PortalField;
    });

    describe("should be able to create class for", function() {

        describe("layout that is", function() {

            it("base", function() {
                var klass = app.view.declareComponent("layout", "list");
                expect(klass).toEqual(app.view.Layout);
            });

            it("custom base", function() {
                app.view.PortalLayout = Backbone.View;
                var klass = app.view.declareComponent("layout", "list");
                expect(klass).toEqual(app.view.PortalLayout);
            });

            it("typed", function() {
                var instance = app.view._createComponent("layout", "list", {type:"fluid"});
                expect(instance instanceof app.view.layouts[ucPlatform+'FluidLayout']).toBeTruthy();
            });

            it("named components are extended from when declaring", function() {
                app.view.layouts.MyLayout = app.view.Layout.extend({foo:true});
                var klass = app.view.declareComponent("layout", "my");
                expect(klass).toEqual(app.view.layouts.MyLayout);
                expect(app.view.layouts.MyLayout).toBeDefined();
                expect(app.view.layouts[ucPlatform+'MyLayout']).toBeDefined();
                expect(app.view.layouts[ucPlatform+'MyLayout'].prototype.foo).toEqual(true);
                delete app.view.layouts.MyLayout;
                delete app.view.layouts[ucPlatform+'MyLayout'];
            });

            it("module-specific named", function() {
                app.view.layouts.AccountsDetailLayout = app.view.Layout.extend();
                var klass = app.view.declareComponent("layout", "detail", "Accounts");
                expect(klass).toEqual(app.view.layouts[ucPlatform+'AccountsDetailLayout']);
                expect(app.view.layouts.AccountsDetailLayout).toBeDefined();
                expect(app.view.layouts[ucPlatform+'AccountsDetailLayout']).toBeDefined();
                expect(klass).not.toEqual(app.view.layouts.AccountsDetailLayout);
                delete app.view.layouts.AccountsDetailLayout;
                delete app.view.layouts[ucPlatform+'AccountsDetailLayout'];
            });

            it("should use platform passed in before app.config.platform", function() {
                var platform = app.view._getPlatform({platform:'foo'});
                expect(platform).toEqual('foo');
            });
            it("module-specific named with controller", function() {
                app.view.declareComponent("layout", "detail", "Accounts", { foo: function() {} });
                expect(app.view.layouts[ucPlatform+'AccountsDetailLayout']).toBeDefined();
                expect(app.view.layouts[ucPlatform+'AccountsDetailLayout'].prototype.foo).toBeDefined();
            });

            it("BaseLayout type", function() {
                app.view.declareComponent("layout", "base", "", {});
                expect(app.view.layouts[ucPlatform+'BaseLayout']).toBeDefined();//PlatformBaseLayout e.g.PortalBaseLayout
                // Specify the platform to force a base 'BaseBaseLayout' to be created
                app.view.declareComponent("layout", "base", "", {}, false, "base");
                var klass = app.view.declareComponent("layout", "fakeTest");
                expect(app.view.layouts[ucPlatform+'FakeTestLayout']).toBeDefined();
                expect(klass).toEqual(app.view.layouts.BaseBaseLayout);
                delete app.view.layouts.BaseBaseLayout;
                delete app.view.layouts[ucPlatform+'FakeTestLayout'];
                delete app.view.layouts[ucPlatform+'BaseLayout'];
            });

            it("extended from specified type", function() {
                app.view.declareComponent("layout", "cool", null, { foo: function() {} });
                app.view.declareComponent("layout", "fakeTest", null, {extendsFrom:'CoolLayout'});
                expect(app.view.layouts[ucPlatform+'FakeTestLayout'].prototype.foo).toBeDefined();
                expect(app.view.layouts[ucPlatform+'FakeTestLayout'].prototype.foo)
                    .toEqual(app.view.layouts[ucPlatform+'CoolLayout'].prototype.foo);
                delete app.view.layouts[ucPlatform+'CoolLayout'];
                delete app.view.layouts[ucPlatform+'FakeTestLayout'];
            });

            it("defined with controller object", function() {
                app.view.declareComponent("layout", "cool", null, { foo: function() {} });
                expect(app.view.layouts[ucPlatform+'CoolLayout'].prototype.foo).toBeDefined();
                delete app.view.layouts[ucPlatform+'CoolLayout'];
            });
        });

        describe("view that is", function() {

            it("base", function() {
                var klass = app.view.declareComponent("view", "detail");
                expect(klass).toEqual(app.view.View);
            });

            it("custom base", function() {
                app.view.PortalView = Backbone.View;
                var klass = app.view.declareComponent("view", "detail");
                expect(klass).toEqual(app.view.PortalView);
            });

            it("named components are extended from when declaring", function() {
                app.view.views.MyView = app.view.View.extend({foo:true});
                var klass = app.view.declareComponent("view", "my");
                expect(klass).toEqual(app.view.views.MyView);
                expect(app.view.views.MyView).toBeDefined();
                expect(app.view.views[ucPlatform+'MyView']).toBeDefined();
                expect(app.view.views[ucPlatform+'MyView'].prototype.foo).toEqual(true);
                delete app.view.views.MyView
                delete app.view.views[ucPlatform+'MyView'];
            });

            it("module-specific uses platform to find base controller to extend from", function() {
                app.view.views.AccountsDetailView = app.view.View.extend({iWontBeFound:true});
                app.view.views[ucPlatform+"AccountsDetailView"] = app.view.View.extend({iWillBeFound:true});
                var klass = app.view.declareComponent("view", "detail", "Accounts");
                expect(klass).toEqual(app.view.views[ucPlatform+'AccountsDetailView']);
                expect(klass.prototype.iWontBeFound).not.toBeDefined();
                expect(klass.prototype.iWillBeFound).toBeDefined();
                expect(app.view.views[ucPlatform+'AccountsDetailView'].prototype.iWillBeFound).toEqual(true);
                delete app.view.views.AccountsDetailView;
                delete app.view.views[ucPlatform+'AccountsDetailView'];
            });

            it("module-specific with controller can be obtained via _getController", function() {
                app.view.declareComponent("view", "detail", "Accounts", { foo: function() {} });
                expect(app.view.views[ucPlatform+'AccountsDetailView']).toBeDefined();
                expect(app.view.views[ucPlatform+'AccountsDetailView'].prototype.foo).toBeDefined();
                var moduleSpecificController = app.view._getController({type:'view',name:'detail',module:'Accounts',platform:app.config.platform});
                expect(moduleSpecificController.prototype.foo).toBeDefined();
            });

            it("BaseView type", function() {
                app.view.declareComponent("view", "base", "", "{}", false, 'base');
                expect(app.view.views.BaseBaseView).toBeDefined();
                var klass = app.view.declareComponent("view", "fakeTest");
                expect(klass).toEqual(app.view.views.BaseBaseView);
                delete app.view.views.BaseBaseView;
            });

            it("extended from specified type", function() {
                app.view.declareComponent("view", "cool", null, { foo: function() {} });
                app.view.declareComponent("view", "fakeTest", null, {extendsFrom:'CoolView'});
                expect(app.view.views[ucPlatform+'FakeTestView'].prototype.foo).toBeDefined();
                //Now the better way is using _getController; defaults to current platform if not passed in
                var controller = app.view._getController({type:'view',name:'fakeTest'});
                expect(controller.prototype.foo).toBeDefined();
                delete app.view.views[ucPlatform+'CoolView'];
                delete app.view.views[ucPlatform+'FakeTestView'];
            });
        });

        describe("field that is", function() {

            it("default field", function() {
                var klass;
                // Remove base field, should default to field
                delete app.view.fields.BaseBaseField;

                klass= app.view.declareComponent("field", "int");
                expect(klass).toEqual(app.view.Field);
            });

            it("base", function() {
                var klass = app.view.declareComponent("field", "int");
                expect(klass).toEqual(app.view.fields.BaseBaseField);
            });

            it("custom base", function() {
                var klass;

                app.view.PortalField = Backbone.View;
                delete app.view.fields.BaseBaseField; // remove default base field

                klass = app.view.declareComponent("field", "int");
                expect(klass).toEqual(app.view.PortalField);
            });

            it("module specific", function() {
                var klass = app.view.declareComponent("field", "enum", "Cases", {});
                expect(klass).toEqual(app.view.fields[ucPlatform+'CasesEnumField']);
            });

            it("named", function() {
                app.view.fields.IntField = app.view.Field.extend();
                var klass = app.view.declareComponent("field", "int");
                expect(klass).toEqual(app.view.fields.IntField);
                expect(app.view.fields[ucPlatform+'IntField']).toBeDefined();
                var controller = app.view._getController({type:'field',name:'int'});
                delete app.view.fields.IntField;
                delete app.view.fields[ucPlatform+'IntField'];
            });

            it("with controller", function() {
                app.view.declareComponent("field", "int", null, { foo: function() {} });
                expect(app.view.fields[ucPlatform+'IntField']).toBeDefined();
                var controller = app.view._getController({type:'field',name:'int'});
                expect(controller.prototype.foo).toBeDefined();
                delete app.view.fields[ucPlatform+'IntField'];
            });

            it("extended from BaseField type", function() {
                app.view.declareComponent("field", "base", "", {});
                expect(app.view.fields[ucPlatform+'BaseField']).toBeDefined();
                var controller = app.view._getController({type:'field',name:'base'});
                expect(controller).toBeDefined();
                var klass = app.view.declareComponent("field", "fakeTest");
                expect(klass).not.toEqual(controller);
                controller = app.view._getController({type:'field',name:'fakeTest'});
                expect(klass).toEqual(controller);
                delete app.view.fields[ucPlatform+'BaseField'];
            });

            it("extended from specified type", function() {
                app.view.declareComponent("field", "int", null, { foo: function() {} });
                app.view.declareComponent("field", "fakeTest", null, {extendsFrom:'IntField'});
                expect(app.view.fields[ucPlatform+'FakeTestField'].prototype.foo).toBeDefined();
                //Better way to obtain controller
                var controller = app.view._getController({type:'field',name:'fakeTest'});
                expect(controller.prototype.foo).toBeDefined();
                delete app.view.fields[ucPlatform+'IntField'];
                delete app.view.fields[ucPlatform+'FakeTestField'];
            });

        });

        describe("duplicate components", function() {

            it("declareComponent can be asked to remove duplicates", function() {
                var f1, f2, v1, v2, l1, l2, cache;

                // Fields
                f1 = app.view.declareComponent("field", "fubar", null, { foo: function() { return 'fimpl1'; } });
                var fcheck = app.view.declareComponent("field", "fubar", null, { foo: function() { return 'nope'; } });
                // Calling declareComponent without the remove param still results in cached component as before
                expect(app.view._getController({type:'field',name:'fubar'}).prototype.foo()).toEqual('fimpl1');

                // But if we use the remove param it fubar field will be overwritten
                f2 = app.view.declareComponent("field", "fubar", null, { foo: function() { return 'fimpl2'; } }, true);
                expect(app.view._getController({type:'field',name:'fubar'}).prototype.foo()).toEqual('fimpl2');

                // Views
                v1 = app.view.declareComponent("view", "fubar", null, { foo: function() { return 'vimpl1'; } });
                v2 = app.view.declareComponent("view", "fubar", null, { foo: function() { return 'vimpl2'; } }, true);
                // We'll do this the old way just to show how it works but _getController is new way to access
                cache = app.view['views'];
                // Old way still works but you have to prefix .. better to use _getController (see below)
                expect(cache[ucPlatform+'FubarView'].prototype.foo()).toEqual('vimpl2');
                expect(app.view._getController({type:'view',name:'fubar'}).prototype.foo()).toEqual('vimpl2');
                // Layouts
                l1 = app.view.declareComponent("layout", "fubar", null, { foo: function() { return 'limpl1'; } });
                l2 = app.view.declareComponent("layout", "fubar", null, { foo: function() { return 'limpl2'; } }, true);
                expect(app.view._getController({type:'layout',name:'fubar'}).prototype.foo()).toEqual('limpl2');
            });

            it("declareComponent called with remove flag but no controlller is ignored and original preserved", function() {
                var f1, f2, cache;
                f1 = app.view.declareComponent("field", "fubar", null, { foo: function() { return 'original_preserved'; } });
                f2 = app.view.declareComponent("field", "fubar", null, null /*no controller*/, true);
                expect(app.view._getController({type:'field',name:'fubar'}).prototype.foo).toBeDefined();
                expect(app.view._getController({type:'field',name:'fubar'}).prototype.foo()).toEqual('original_preserved');
            });
        });

    });

    describe("should be able to create instances of View class which is", function() {

        it('base class', function () {
            var view = SugarTest.createComponent("View", {
                name: "edit",
                module: "Contacts",
                context: context
            });

            expect(view instanceof app.view.View).toBeTruthy();
            expect(view.meta).toEqual(fixtures.metadata.modules.Contacts.views.edit.meta);
        });

        it('pre-defined view class', function () {
            var view = SugarTest.createComponent("View", {
                name: "list",
                module: "Contacts",
                context: context
            });

            expect(view instanceof app.view.View).toBeTruthy();
        });

        it("custom view class when the view has a custom controller", function () {
            var view = SugarTest.createComponent("View", {
                name : "login",
                module: "Home",
                context: context
            });

            expect(view.customCallback).toBeDefined();
            expect(app.view._getController({type:'view', name:'home-login'})).toBeDefined();
            expect(app.view._getController({type:'view', name:'home-login'}).prototype.customCallback).toBeDefined();
            expect(app.view.views[ucPlatform+'HomeLoginView']).toBeDefined();
        });

        it('base class with custom metadata', function() {
            var testMeta = {
                "panels": [
                    {
                        "label": "TEST",
                        "fields": []
                    }
                ]
            };

            var view = SugarTest.createComponent("View", {
                name: "edit",
                meta: testMeta,
                context: context
            });

            expect(view instanceof app.view.View).toBeTruthy();
            expect(view.meta).toEqual(testMeta);
        });

        it('custom class without metadata', function() {
            app.view.views.ToolbarView = app.view.View.extend();

            var view = SugarTest.createComponent("View", {
                name: "toolbar",
                context: context
            });

            expect(view instanceof app.view.views.ToolbarView).toBeTruthy();
        });

    });

    describe("should be able to create instances of Layout class which is", function() {

        it('base layout class', function () {
            var layout = SugarTest.createComponent("Layout", {
                name : "edit",
                module: "Contacts",
                context: context
            });
            expect(layout instanceof app.view.Layout).toBeTruthy();
            expect(layout._components.length).toEqual(1);
            expect(layout._components[0].layout).toEqual(layout);
        });

        it('layout that has a child layout', function () {
            var parent = SugarTest.createComponent("Layout", {
                name : "parent",
                context: context
            });

            var child = SugarTest.createComponent("Layout", {
                name : "child",
                context: context
            });

            parent.addComponent(child);
            expect(parent._components.length).toEqual(1);
            expect(child.layout).toEqual(parent);

            parent.removeComponent(child);
            expect(child.layout).toBeNull();
            expect(parent._components.length).toEqual(0);
        });

        it("layout with a custom controller", function () {
            var layout;

            app.view.declareComponent("layout", "fluid", null, null, "fluid");
            layout = SugarTest.createComponent("Layout", {
                name : "detailplus",
                module: "Contacts",
                context: context,
                platform: 'base'
            });

            // Originally checked to see if DetailPlus is a Fluid Layout, however it is no longer the case
            // after migrating layouts serverside, not sure what happened.
            expect(layout instanceof app.view.layouts.BaseContactsDetailplusLayout).toBeTruthy();
            var controller = app.view._getController({
                type: "layout",
                name : "detailplus",
                module: "Contacts",
                platform: 'base'
            });
            expect(layout instanceof controller).toBeTruthy();
            expect(layout.customLayoutCallback).toBeDefined();
            expect(controller.prototype.customLayoutCallback).toBeDefined();
        });

        it("layout with a custom controller passed in params", function () {
            var layout = SugarTest.createComponent("Layout", {
                name : "tree",
                context: context,
                controller: {customTreeLayoutHook: function(){return "overridden";}},
                module: "Contacts"
            });

            expect(layout).toBeDefined();
            expect(layout.customTreeLayoutHook).toBeDefined();
            var treeController = app.view._getController({name:'tree',type:'layout',module:'Contacts'});
            expect(treeController.prototype.customTreeLayoutHook).toBeDefined();
            expect(layout instanceof treeController).toBeTruthy();
        });

        it('layout with custom metadata', function(){
            var layout,
                testMeta = {
                "type" : "simple",
                "module" : "Contacts",
                "components" : [
                    {view : "testComp"}
                ]
            };

            layout = SugarTest.createComponent("Layout", {
                context : context,
                name: "edit",
                meta: testMeta
            });

            expect(layout instanceof app.view.Layout).toBeTruthy();
            expect(layout.meta).toEqual(testMeta);
        });

        it('"nameless" layout with inline definition', function() {
            var layout,
                testMeta = {
                "type" : "fluid",
                "components" : [
                    {view : "testComp"}
                ]
            };

            layout = SugarTest.createComponent("Layout", {
                context : context,
                meta: testMeta,
                module: "Contacts"
            });

            expect(layout instanceof app.view.layouts.BaseFluidLayout).toBeTruthy();
        });

    });

    describe("should be able to create instances of Field class", function() {

        var bean, collection, view;

        beforeEach(function() {

            //Need a sample Bean
            bean = app.data.createBean("Contacts", {
                first_name: "Foo",
                last_name: "Bar"
            });

            collection = new app.BeanCollection([bean]);

            //Setup a context
            context.set({
                module: "Contacts",
                model: bean,
                collection: collection
            });

            view = new app.view.View({ name: "test", context: context });
        });

        it("with viewdef merged with vardef", function() {
            var def = fixtures.metadata.modules.Cases.views.edit.meta.panels[0].fields[0];
            var ctx = app.context.getContext();
            ctx.set({
                module: "Cases",
                model: app.data.createBean("Cases")
            });
            var result = SugarTest.createComponent("Field", {
                def: def,
                context: ctx,
                view: new app.view.View({ name: "edit", context: context })
            });

            expect(result instanceof app.view.Field).toBeTruthy();
            expect(result.type).toEqual("float");
            expect(result.name).toEqual("case_number");
            expect(result.label).toEqual("Case Number");
            expect(result.def.round).toEqual(2);
            expect(result.def.precision).toEqual(2);
            expect(result.def.number_group_seperator).toEqual(",");
            expect(result.def.decimal_seperator).toEqual(".");
            expect(result.def.class).toEqual("foo");
        });

        // TODO: We should have an expectation here no? What's the purpose of this test?
        it("should use the vardef controller if provided", function() {
            var def, result, ctx, meta;
            meta = app.metadata.getField('relate'); //has a controller
            def = {
                    'class': "foo",
                    'label': "Relate Label",
                    'name': "relate",
                    'type': "relate"
            };
            ctx = app.context.getContext();
            ctx.set({
                module: "Cases",
                model: app.data.createBean("Cases")
            });
            result = SugarTest.createComponent("Field", {
                def: def,
                context: ctx,
                meta: meta,
                view: new app.view.View({ name: "edit", context: context })
            });
        });


        it("with default template", function() {
            var fieldId = app.view.getFieldId();
            var def = {
                type: 'addresscombo',
                name: "address",
                label: "Address"
            };
            var result = SugarTest.createComponent("Field", {
                def: def,
                context: context,
                view: view
            });

            expect(result instanceof app.view.Field).toBeTruthy();
            expect(result.type).toEqual("addresscombo");
            expect(result.name).toEqual("address");
            expect(result.label).toEqual("Address");
            expect(result.context).toEqual(context);
            expect(result.def).toEqual(def);
            expect(result.model).toEqual(bean);
            expect(result.sfId).toEqual(fieldId + 1);
            expect(view.fields[result.sfId]).toEqual(result);
        });

        it("of custom class", function() {
            app.view.fields.AddresscomboField = app.view.Field.extend({
                foo: "foo"
            });

            var result = SugarTest.createComponent("Field", {
                def: {
                    type: 'addresscombo',
                    name: "address",
                    label: "Address"
                },
                context: context,
                view: view
            });

            expect(result instanceof app.view.fields.AddresscomboField).toBeTruthy();
            expect(result.foo).toEqual("foo");
        });

        it("of module level field", function() {
            var result = SugarTest.createComponent("Field", {
                def: {
                    type: 'enum',
                    name: "enum",
                    label: "Enum"
                },
                context: context,
                view: view,
                module: "Cases"
            });
            var casesEnumController = app.view._getController({type:'field',name:'enum',module:'Cases'});
            expect(result instanceof casesEnumController).toBeTruthy();
            expect(result instanceof app.view.fields[ucPlatform+'CasesEnumField']).toBeTruthy();
        });
        it("of non-existent module level field", function() {
            var result = SugarTest.createComponent("Field", {
                def: {
                    type: 'enum',
                    name: "enum",
                    label: "Enum"
                },
                context: context,
                view: view,
                module: "Contacts"
            });

            expect(result instanceof app.view.fields.BaseEnumField).toBeTruthy();
            expect(app.view.fields[ucPlatform+'ContactsEnumField']).toBeDefined();
        });

        it("of custom class with controller", function() {
            var result = SugarTest.createComponent("Field", {
                def: {
                    type: 'base',
                    name: "description"
                },
                context: context,
                view: view
            });

            expect(app.view.fields.BaseBaseField).toBeDefined();
            expect(result instanceof app.view.fields.BaseBaseField).toBeTruthy();
            expect(result.customCallback).toBeDefined();

            // Checking fall back algorithm
            expect(result.label).toEqual('description');
        });

        it("and use another template than the view name", function() {

            var editView = new app.view.View({ name: "edit", context: context });
            var opts = {
                def: {
                    type: 'base',
                    name: "name"
                },
                context: context,
                view: editView,
                viewName: "detail" // override template (the "default" template will be used instead of "detail"
            };

            var field = SugarTest.createComponent("Field", opts);
            expect(field).toBeDefined();
            field._loadTemplate();

            var ctx = { value: "a value" };

            expect(field.template(ctx)).toEqual(Handlebars.templates["f.base.detail"](ctx));
            expect(field.tplName).toEqual("detail");
            expect(field.action).toEqual("edit");
        });

        it("and use the module specified by the model", function() {

            context.set({"module":"Home"});

            var editView = new app.view.View({ name: "edit", context: context });
            var opts = {
                def: {
                    type: 'base',
                    name: "name"
                },
                context: context,
                view: editView
            };

            var field = SugarTest.createComponent("Field", opts);
            expect(field).toBeDefined();
            expect(field.module).toEqual("Contacts");
        });

        it("and use the module specified by the view when the module is not specified on the model", function() {

            //Need a sample Bean
            bean = app.data.createBean("Blah", {
                first_name: "Foo",
                last_name: "Bar"
            });
            collection = new app.BeanCollection([bean]);

            //Setup a context
            context.set({
                module: "Home",
                model: bean,
                collection: collection
            });

            var editView = new app.view.View({ name: "edit", context: context });
            var opts = {
                def: {
                    type: 'base',
                    name: "name"
                },
                context: context,
                view: editView
            };

            var field = SugarTest.createComponent("Field", opts);
            expect(field).toBeDefined();
            expect(field.module).toEqual("Home");
        });

        it("and use the module specified by the model when it's set on the context", function() {

            //Need a sample Bean
            bean = app.data.createBean("Blah", {
                first_name: "Foo",
                last_name: "Bar"
            });
            bean.module = "Home2";
            collection = new app.BeanCollection([bean]);

            //Setup a context
            context.set({
                module: 'Home',
                model: bean,
                collection: collection
            });

            var editView = new app.view.View({ name: "edit", context: context });
            var opts = {
                def: {
                    type: 'base',
                    name: "name"
                },
                context: context,
                view: editView
            };

            var field = SugarTest.createComponent("Field", opts);
            expect(field).toBeDefined();
            expect(field.module).toEqual("Home2");
        });
    });

    describe("should have working utility functions which", function () {

        it("properly determine if a component class has a given plugin", function () {
            //First test the positive case
            expect(app.view.componentHasPlugin({
                type:"view",
                name:"plugintestview",
                plugin:"foo"
            })).toBeTruthy();

            //View with plugins, just not the one we are looking for
            expect(app.view.componentHasPlugin({
                type:"view",
                name:"plugintestview",
                plugin:"bar"
            })).toBeFalsy();

            //View with no plugins
            expect(app.view.componentHasPlugin({
                type:"view",
                name:"login",
                plugin:"bar"
            })).toBeFalsy();
        });
    });
});
