describe('template', function() {
    var app;

    beforeEach(function() {
        app = SugarTest.app;
    });

    afterEach(function() {
        //Reset the cache after every test
        app.cache.cutAll();
        delete Handlebars.templates;
    });

    it('should compile templates', function() {
        var src = "Hello {{name}}!",
            key = "testKey",
            temp = app.template.compile(key, src);
        expect(temp({name: "Jim"})).toEqual("Hello Jim!");
    });

    it('should compile template into empty function if template is invalid', function() {
        var src = "Hello {{}}!",
            key = "invalidTemplate",
            temp = app.template.compile(key, src);
        expect(temp({name: "Jim"})).toEqual("");
    });

    it('should retrieve compiled templates', function() {
        var src = "Hello {{name}}!",
            key = "testKey";
        //Compile the template
        app.template.compile(key, src);

        // We don't cache templates by default
        expect(app.cache.get("templates")).toBeUndefined();

        //The compiled template should be attached to Handlebars
        expect(app.template.get(key)).toEqual(Handlebars.templates[key]);

        //Get should return a compiled template
        expect(app.template.get(key)({name: "Jim"})).toEqual("Hello Jim!");
    });

    it('should retrieve compiled templates from cache', function() {
        var src = "Hello {{name}}!",
            key = "testKey";
        //Compile the template
        app.template.compile(key, src);
        //Initialize will reset the internal varaibles referencing the tempaltes in memory
        app.template.init();

        //Get should return a compiled template
        expect(app.template.get(key)({name: "Jim"})).toEqual("Hello Jim!");
    });

    it('should load multiple templates in a single call', function() {
        var data = {
            views: {
                hello: {
                    templates: {
                        hello: "Hello {{name}}!"
                    }
                },
                foo: {
                    templates: {
                        foo: "Bar"
                    }
                }
            }
        };
        app.template.set(data);

        //Get should return both the templates
        expect(app.template.get("hello")({name: "Jim"})).toEqual("Hello Jim!");
        expect(app.template.get("foo")()).toEqual("Bar");
    });

    it('should set and get layout templates', function() {
        var source = "<div>Layout Template</div>",
            data = {
                layouts: {
                    test: {
                        templates: {
                            test: source
                        }
                    }
                }
            };

        app.template.set(data);

        expect(app.template.getLayout("test")()).toEqual(source);
    });
    it('should retrieve the module based template', function() {
        app.template.setField('enum', 'detail', 'Cases', fixtures.metadata.modules.Cases.fieldTemplates.enum.templates.detail, true);
        expect(app.template.getField("enum", "detail", "Cases")({
            value: "Hello"
        })).toEqual('Cases Enum Detail: Hello');
    });
    it('should retrieve the field view for type if no module set', function() {
        app.template.setField('enum', 'detail', null, fixtures.metadata.modules.Cases.fieldTemplates.enum.templates.detail, true);
        expect(app.template.getField("enum", "detail", "Cases")({
            value: "Hello"
        })).toEqual('Cases Enum Detail: Hello');
    });
    it('should fall back to the fallback arg before the base template including module', function() {
        app.template.setField('enum', 'detail', 'Cases', fixtures.metadata.modules.Cases.fieldTemplates.enum.templates.detail, true);
        expect(app.template.getField("enum", "list", "Cases", "detail")({
            value: "Hello"
        })).toEqual('Cases Enum Detail: Hello');
    });
    it('should fall back to the fallback arg before the base template with for no module', function() {
        app.template.setField('enum', 'detail', null, fixtures.metadata.modules.Cases.fieldTemplates.enum.templates.detail, true);
        expect(app.template.getField("enum", "list", "Cases", "detail")({
            value: "Hello"
        })).toEqual('Cases Enum Detail: Hello');
    });
    it('should retreive base template if none are available for the current field', function() {
        app.template.compile("f.base.detail", fixtures.metadata.fields.base.templates.detail);
        expect(app.template.getField("non-existant-field", "detail")({
            value: "Hello"
        })).toEqual('<h3></h3><span name="">Hello</span>');
    });
    it('should retrieve the fallback template if no other templates are available', function() {
        app.template.compile("f.base.detail", fixtures.metadata.fields.base.templates.detail);
        expect(app.template.getField("non-existant-field", "non-existant-view", null, "detail")({
            value: "Hello"
        })).toEqual('<h3></h3><span name="">Hello</span>');
    });

    it('should set multiple templates from a single view', function() {
        var data = {
            views: {
                test123: {
                    templates: {
                        test123: "foo",
                        test_2: "bar"
                    }
                }
            }
        };

        app.template.set(data);

        expect(app.template.getView("test123")()).toEqual("foo");
        expect(app.template.getView("test123.test_2")()).toEqual("bar");
    });

});
