describe("Field", function() {

    var app, bean, view, context;

    beforeEach(function() {
        app = SugarTest.app;
        SugarTest.seedMetadata(true);
        app.data.declareModel("Cases", fixtures.metadata.modules.Cases);
        bean = app.data.createBean("Cases");
        context = app.context.getContext();
        view = new app.view.View({ name: "test", context: context });
    });

    afterEach(function() {
        app.cache.cutAll();
        delete Handlebars.templates;
    });

    it("should delegate events", function() {
        var delegateSpy = sinon.spy(Backbone.View.prototype, 'delegateEvents'),
            events, bean, inputEvents, field;

        events = {"click": "callback_click"};
        bean = new Backbone.Model();
        inputEvents = fixtures.metadata.modules.Cases.views.edit.meta.buttons[0].events;
        field = SugarTest.createComponent("Field", {
            def: { name: "status", type: "varchar" },
            view: view,
            context: context,
            model: bean
        });

        field = SugarTest.createComponent("Field", {
            def: { name: "status", type: "varchar" },
            view: view,
            context: context,
            model: bean
        });

        field.delegateEvents(inputEvents);
        expect(delegateSpy).toHaveBeenCalledWith(events);
        delegateSpy.restore();
    });

    it("should render html", function() {
        var field = SugarTest.createComponent("Field", {
            def: {name: "status", type: "base"},
            view: view,
            context: context,
            model: bean
        });

        var spy = sinon.spy(field, "format");

        bean.set({status: "new", id: "anId"});
        field.render();

        expect(spy).toHaveBeenCalled();
        expect(spy.args[0][0]).toEqual("new");
        expect(field.tplName).toEqual("test");
        expect(field.action).toEqual("test");
        expect(field.$el.html()).toEqual('<h3>status</h3><span name="status">new</span>');

        spy.restore();
    });

    //in this test we want to make sure that field will be rendered correctly if template function returns undefined
    it("should fail-safe render html if empty template is supplied", function(){

        var originalTemplate = Handlebars.templates['f.base.test'];

        Handlebars.templates['f.base.test'] = Handlebars.compile('{{!Such template renders undefined and not empty string}}');

        var field = SugarTest.createComponent("Field", {
            def: {name: "status", type: "base"},
            view: view,
            context: context,
            model: bean
        });

        app.config.env = 'prod';
        field.render();
        expect(field.$el.html()).toEqual('');

        app.config.env = 'test';
        field.render();
        expect(field.$el.html()).toEqual('');

        Handlebars.templates['f.base.test'] = originalTemplate;
    });

    it("should not render field we don't have access to", function() {
        bean = app.data.createBean("Test");
        view.action = "edit";
        var field = SugarTest.createComponent("Field", {
            def: {name: "priority", type: "base"},
            view: view,
            context: context,
            model: bean
        });

        // simulate first render with no data (with acl being passed with the model now, this should be rendered)
        field.render();

        expect(field.tplName).toEqual("test");
        expect(field.action).toEqual("edit");
        expect(field.$el.html()).toEqual('<h3>priority</h3><span name="priority"></span>');

        // data received
        bean.set({priority: "1", id: "anId"});
        bean.set('_acl', {
            "fields": {
                "priority": {
                    "create": "no",
                    "read": "no",
                    "write": "no"
                }
            }
        });

        // re-render the field
        field.render();

        expect(field.tplName).toBeUndefined();
        expect(field.action).toBeUndefined();
        expect(field.$el.html()).toEqual('');
    });

    it("should bind bind model change on render", function() {
        var field = SugarTest.createComponent("Field", {
                def: {name: "status", type: "text"},
                view: view,
                context: context,
                model: bean
            }),
            spy = sinon.spy(field, 'bindDomChange');

        bean.set({status: "new", id: "anId"});

        expect(spy).toHaveBeenCalled();
    });

    it("handle errors on model validation error", function() {
        var handleSpy = sinon.spy(app.view.Field.prototype, 'handleValidationError');
        var field = SugarTest.createComponent("Field", {
            def: {name: "status", type: "text"},
            view: view,
            context: context,
            model: bean
        });
        var errors = {
            status: {
                error: "some random error string"
            }
        };
        bean._processValidationErrors(errors);
        expect(handleSpy).toHaveBeenCalled();
        handleSpy.restore();
    });


    it("bind render to model change events", function() {
        var field = SugarTest.createComponent("Field", {
            def: {name: "status", type: "text"},
            view: view,
            context: context,
            model: bean
        });


        bean.set({status: "new", id: "anId"});
        field.render();
        expect(field.$el.html()).toEqual('<h3>status</h3><span name="status">new</span>');

        bean.set("status", "older");

        expect(field.$el.html()).toEqual('<h3>status</h3><span name="status">older</span>');
    });

    it("update model on dom input change", function() {
        var id = _.uniqueId('sugarFieldTest'),
            bean, field, input, view;

        $('body').append('<div id="' + id + '"></div>');
        bean = new Backbone.Model();
        view = new app.view.View({name: 'edit', context: context});
        field = SugarTest.createComponent("Field", {
            def: {name: "status", type: "text"},
            view: view,
            context: context,
            model: bean,
            el: $('#' + id)
        });

        bean.set({status: "new"});
        input = field.$el.find("input");
        input.attr('value', 'bob');
        input.trigger('change');
        expect(bean.get('status')).toEqual('bob');

        field.unbindDom();
        // HACK: Replicate Field.unbindDom functionality here
        // Zepto doesn't unbind event !?!?!
        // The good news is it works in real app but not in this test.
        if (typeof Zepto != "undefined") input.off();

        input.attr('value', 'foo');
        input.trigger('change');
        expect(bean.get('status')).toEqual('bob');

        $('#' + id).remove();
    });

    it("should be able to get the correspond DOM element", function(){
        var id = _.uniqueId('sugarFieldTest'),
            field, view,
            dom = $('<div id="' + id + '"><span><input></span></div>');

        $('body').append(dom);
        view = new app.view.View({name: 'edit', context: context});
        field = SugarTest.createComponent("Field", {
            def: fixtures.metadata.modules.Cases.views.edit.meta.buttons[0],
            view: view,
            context: context,
            model: bean,
            el: $('#' + id)
        });

        field.$el.html("Text");
        expect(field.getFieldElement()).toBe(field.$el);
    });

    it("should add a css class specified in the viewdefs", function() {
        var id = _.uniqueId('sugarFieldTest'),
            field, view;

        $('body').append('<div id="' + id + '"></div>');
        view = new app.view.View({name: 'edit', context: context});
        field = SugarTest.createComponent("Field", {
            def: fixtures.metadata.modules.Cases.views.edit.meta.buttons[0],
            view: view,
            context: context,
            model: bean,
            el: $('#' + id)
        });
        field.render();

        expect(field.getFieldElement().hasClass("btn-primary")).toBeTruthy();
    });

    it("should be able to protect editmode", function() {
        var id = _.uniqueId('sugarFieldTest');
        $('body').append('<div id="' + id + '"></div>');
        var view = new app.view.View({name: 'record', context: context}),
            field = SugarTest.createComponent("Field", {
            def: {name: "status", type: "text"},
            view: view,
            context: context,
            el: $('#' + id)
        });
        expect(field.options.viewName).not.toBe("detail");
        expect(field.isDisabled()).toBeFalsy();
        field.render();

        //If current view is not editable, view should not be replaced with disabled template
        field.setDisabled(true);
        expect(field._previousAction).toBe("record");
        expect(field.action).toBe("disabled");
        expect(field.isDisabled()).toBeTruthy();
        expect(field.tplName).not.toBe("disabled");

        //If current field switches to the edit mode, view should render the disabled template.
        field.setMode('edit');
        expect(field._previousAction).toBe("edit");
        expect(field.tplName).toBe("disabled");

        field.setDisabled(false);
        expect(field.action).not.toBe("disabled");
        expect(field.action).toBe("edit");
        expect(field.isDisabled()).toBeFalsy();

        field.setDisabled();
        expect(field.action).toBe("disabled");
        expect(field.isDisabled()).toBeTruthy();
    });

    it("should be able to be shown or hidden", function() {
        var id = _.uniqueId('sugarFieldTest'),
            field, view,
            dom = $('<div id="' + id + '"><span><input></span></div>');

        $('body').append(dom);
        view = new app.view.View({name: 'edit', context: context});
        field = SugarTest.createComponent("Field", {
            def: fixtures.metadata.modules.Cases.views.edit.meta.buttons[0],
            view: view,
            context: context,
            model: bean,
            el: $('#' + id)
        });

        field.show();
        expect(field.getFieldElement().is(":visible")).toBe(true);
        expect(field.getFieldElement().is(":hidden")).toBe(false);
        expect(field.getFieldElement().hasClass('hide')).toBe(false);
        expect(field.isVisible()).toBe(true);

        field.hide();
        expect(field.getFieldElement().is(":visible")).toBe(false);
        expect(field.getFieldElement().is(":hidden")).toBe(true);
        expect(field.getFieldElement().hasClass('hide')).toBe(true);
        expect(field.isVisible()).toBe(false);
    });

    it("should be able to switch to the edit and detail mode", function() {
        var id = _.uniqueId('sugarFieldTest');
        $('body').append('<div id="' + id + '"></div>');
        var view = new app.view.View({name: 'edit', context: context}),
            field = SugarTest.createComponent("Field", {
                def: {name: "status", type: "text"},
                view: view,
                context: context,
                el: $('#' + id)
            });
        field.render();
        expect(field.action).toBe("edit");

        field.setMode("detail");
        expect(field.action).toBe("detail");

        field.setMode("edit");
        expect(field.action).toBe("edit");
    });

    it("Test for method _getFallbackTemplate ", function() {
        var field = SugarTest.createComponent("Field", {
            def: {
                type: 'base',
                name: 'testfield',
                label: 'testfield'
            },
            context: context,
            view: view
        });

        field.setDisabled(true);
        expect(field._getFallbackTemplate('disabled')).toBe('edit');

        field.view.fallbackFieldTemplate = 'edit';
        expect(field._getFallbackTemplate('edit')).toBe('edit');

        field.setDisabled(false);
        field.view.fallbackFieldTemplate = 'list';
        expect(field._getFallbackTemplate('disabled')).toBe('list');

        field.view.fallbackFieldTemplate = null;
        expect(field._getFallbackTemplate('edit')).toBe('detail');

        field.view.fallbackFieldTemplate = 'list';
        expect(field._getFallbackTemplate('list')).toBe('list');
    });
});
