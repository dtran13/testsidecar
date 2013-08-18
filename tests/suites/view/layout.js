describe("View.Layout", function(){
    var app;

    beforeEach(function() {
        SugarTest.seedMetadata(true);
        app = SugarTest.app;
    });

    it("should use custom layout template", function() {
        app.metadata.set({
            modules:{
                Avengers:{
                    layouts:{
                        foo:{
                            controller:"({})",
                            templates: {
                                "foo": "Custom Layout Template"
                            }
                        }
                    }
                }
            }
        });
        var layout = SugarTest.createComponent("Layout", {
            name : "foo",
            module: "Avengers",
            meta : []
        });
        expect(layout.$el.html()).toEqual("Custom Layout Template");
    });
    it("should set a layout's label if meta.label provided", function() {
        var layout = SugarTest.createComponent("Layout", {
            name : "foo", module: "Bar",
            meta : {label: 'my_meta_label'}
        });
        expect(layout.label).toEqual('my_meta_label');
    });
    it("should set a layout's label if options.def.label provided", function() {
        var layout = SugarTest.createComponent("Layout", {
            name : "foo", module: "Bar", meta: {},
            def: { label: "my_options_def_label"}
        });
        expect(layout.label).toEqual('my_options_def_label');
    });
    it("should set a layout's label if options.label provided", function() {
        var layout = SugarTest.createComponent("Layout", {
            name : "foo", module: "Bar", meta: {},
            label: "my_options_label"
        });
        expect(layout.label).toEqual('my_options_label');
    });
    it("should fallback to empty string for layout's label", function() {
        var layout = SugarTest.createComponent("Layout", {name : "foo", module: "Bar", meta: {}});
        expect(layout.label).toEqual('');
    });
    it("should use load non-module specific layout templates", function() {
            app.metadata.set({
                layouts:{
                    myLayout1:{
                        controller:"({})",
                        templates: {
                            "myLayout1": "OOB Layout Template"
                        }
                    }
                }
            });
            var layout = SugarTest.createComponent("Layout", {
                name : "myLayout1",
                module: "Avengers",
                meta : []
            });
            expect(layout.$el.html()).toEqual("OOB Layout Template");
        });

    it("should get a component by name", function() {
        var layout = SugarTest.createComponent("Layout", {
            name : "edit",
            module: "Contacts"
        });

        layout.addComponent(SugarTest.createComponent("View", {
            name: "subedit"
        }));

        expect(layout._components.length).toEqual(2);

        var component = layout.getComponent("edit");
        expect(component).toBeDefined();
        expect(component.name).toEqual("edit");
        expect(component instanceof app.view.View).toBeTruthy();

        expect(layout.getComponent("foo")).toBeUndefined();

        layout._addComponentsFromDef([{view: 'blah-list'}]);
        var actualBlahComponent = layout.getComponent("blah-list");
        expect(actualBlahComponent).toBeDefined();
        expect(actualBlahComponent.module).toBe(layout.module);
        expect(actualBlahComponent.context).toBe(layout.context);
    });

    it("should get a sub-layout by component name", function() {
        var layout = SugarTest.createComponent("Layout", {
            name : "edit",
            module: "Contacts"
        });

        layout.addComponent(SugarTest.createComponent("Layout", {
            name: "sublayout",
            meta: {}
        }));

        expect(layout._components.length).toEqual(2);

        var component = layout.getComponent("sublayout");
        expect(component).toBeDefined();
        expect(component.name).toEqual("sublayout");
        expect(component instanceof app.view.Layout).toBeTruthy();
    });


    it("should load a sublayout from inline definition", function() {
        var layout = SugarTest.createComponent("Layout", {
            type : "simple",
            module: "Contacts",
            meta: {
                components:[{
                    layout : {
                        type:"simple",
                        meta : {
                            foo:"bar"
                        }
                    }
                }]
            }
        });

        expect(layout._components.length).toEqual(1);
        expect(layout._components[0].meta.foo).toEqual("bar");
    });

    it("should load a view from inline definition", function() {
           var layout = SugarTest.createComponent("Layout", {
               type : "simple",
               module: "Contacts",
               meta: {
                   components:[{
                       view : {
                           type:"simple",
                           meta : {
                               foo:"bar"
                           }
                       }
                   }]
               }
           });

           expect(layout._components.length).toEqual(1);
           expect(layout._components[0].meta.foo).toEqual("bar");
           expect(layout._components[0] instanceof app.view.View).toBeTruthy();
       });

    it("should get a sub-layout should have name from def type", function() {
        var layout = SugarTest.createComponent("Layout", {
            name : "edit",
            module: "Contacts"
        });

        layout.addComponent(SugarTest.createComponent("Layout", {
            type: "sublayout",
            meta: {}
        }));

        expect(layout._components.length).toEqual(2);

        var component = layout.getComponent("sublayout");
        expect(component).toBeDefined();
        expect(component.name).toEqual("sublayout");
        expect(component instanceof app.view.Layout).toBeTruthy();
    });

    // Please refer to: https://www.pivotaltracker.com/story/show/30426995
    xit("should dispose itself", function() {
        var model = app.data.createBean("Contacts");
        var collection = app.data.createBeanCollection("Contacts");
        var context = app.context.getContext({
            model: model,
            collection: collection
        });

        var layout = SugarTest.createComponent("Layout", {
            name: "edit",
            module: "Contacts",
            context: context
        });

        var view = layout._components[0];
        view.fallbackFieldTemplate = "edit";
        view.template = app.template.get("edit");
        view.on("foo", function() {});

        // Fake bindDataChange
        collection.on("reset", view.render, view);

        // Different scope
        var obj = {
            handler: function() {}
        };
        model.on("change", obj.handler, obj);
        collection.on("reset", obj.handler, obj);

        layout.render();
        var fields = _.clone(view.fields);

        expect(_.isEmpty(model._callbacks)).toBeFalsy();
        expect(_.isEmpty(collection._callbacks)).toBeFalsy();
        expect(_.isEmpty(view._callbacks)).toBeFalsy();

        var spy = sinon.spy(app.view.Field.prototype, "unbindDom");
        var spy2 = sinon.spy(app.view.Component.prototype, "remove");

        layout.dispose();

        // Dispose shouldn't remove callbacks that are not scoped by components
        expect(_.keys( model._callbacks).length).toEqual(1);
        expect(_.keys( model._callbacks)[0]).toEqual("change");
        expect(_.keys(collection._callbacks).length).toEqual(1);
        expect(_.keys(collection._callbacks)[0]).toEqual("reset");

        // Check if layout is disposed
        expect(layout.disposed).toBeTruthy();
        expect(layout._components.length).toEqual(0);
        expect(layout.model).toBeNull();
        expect(layout.collection).toBeNull();
        expect(function() { layout.render(); }).toThrow();

        // Check if view is disposed
        expect(view.disposed).toBeTruthy();
        expect(_.isEmpty(view.fields)).toBeTruthy();
        expect(_.isEmpty(view._callbacks)).toBeTruthy();
        expect(view.model).toBeNull();
        expect(view.collection).toBeNull();
        expect(function() { view.render(); }).toThrow();

        // Check if fields are disposed
        expect(spy.callCount).toEqual(6); // for each field
        _.each(fields, function(field) {
            expect(field.disposed).toBeTruthy();
            expect(function() { field.render(); }).toThrow();
            expect(field.model).toBeNull();
            expect(field.collection).toBeNull();
        });

        expect(spy2.callCount).toEqual(8); // 6 fields + 1 layout + 1 view

    });

    // TODO: Test Layout class: render method
    // TODO: Need to defined tests for sublayout, complex layouts, and inline defined layouts

});
