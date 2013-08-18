describe("Handlebars Helpers", function() {

    var app;
    var user = SUGAR.App.user;

    beforeEach(function() {
        app = SugarTest.app;
    });

    // TODO: Create test for each helper

    describe("getFieldValue", function() {

        it("should return value for an existing field", function() {
            var bean = new app.Bean({ foo: "bar"});
            expect(Handlebars.helpers.getFieldValue(bean, "foo")).toEqual("bar");
        });

        it("should return empty string for a non-existing field", function() {
            var bean = new app.Bean();
            expect(Handlebars.helpers.getFieldValue(bean, "foo")).toEqual("");
        });

        it("should return default string for a non-existing field", function() {
            var bean = new app.Bean();
            expect(Handlebars.helpers.getFieldValue(bean, "foo", "bar")).toEqual("bar");
        });

    });

    describe("field", function() {

        it("should return a sugarfield span element", function() {
            var model = new app.Bean();
            var context = {
                    get: function() {
                        return "Cases";
                    }
                };
            var view = new app.view.View({ name: "detail", context: context});
            var def = {name: "TestName", label: "TestLabel", type: "text"};

            var fieldId = app.view.getFieldId();
            var result = Handlebars.helpers.field.call(def, view, {
                hash : {
                    model: model
                }
            });
            expect(result.toString()).toMatch(/<span sfuuid=.*(\d+).*/);
            expect(app.view.getFieldId()).toEqual(fieldId + 1);
            expect(view.fields[fieldId + 1]).toBeDefined();
        });

        it("should customize the view type", function() {
            var model = new app.Bean();
            var context = {
                get: function() {
                    return "Cases";
                }
            };
            var view = new app.view.View({ name: "detail", context: context});
            var def = {name: "TestName", label: "TestLabel", type: "text"};
            var viewType = 'custom_view_name';

            var fieldId = app.view.getFieldId();
            var result = Handlebars.helpers.field.call(def, view, {
                hash: {
                    model: model,
                    template: viewType
                }
            });
            expect(app.view.getFieldId()).toEqual(fieldId + 1);
            expect(view.fields[fieldId + 1].options.viewName).toEqual(viewType);
        });
    });

    describe("buildRoute", function() {
        var routerMock, model, context, module;

        beforeEach(function() {
            app.router = app.router || {};
            app.router.buildRoute = app.router.buildRoute || function() {};
            routerMock = sinon.mock(app.router);

            model = new app.Bean();
            model.id = "123";
            module = "Cases";
            context = {
                get: function() {
                    return module;
                }
            };
        });

        afterEach(function() {
            routerMock.restore();
        });

        it("should call app.router.buildRoute with the appropriate inputs for create route", function() {
            var action = "create",
                expectedId = model.id;

            routerMock.expects('buildRoute').once().withArgs(module, expectedId, action);
            Handlebars.helpers.buildRoute({hash: {context: context, model: model, action: action}});
            expect(routerMock.verify()).toBeTruthy();
        });

        it("should call app.router.buildRoute with the appropriate inputs for non-create route", function() {
            var action = "",
                expectedId = model.id;

            routerMock.expects('buildRoute').once().withArgs(module, expectedId, action);
            Handlebars.helpers.buildRoute({hash: {context: context, model: model, action: action}});
            expect(routerMock.verify()).toBeTruthy();
        });
    });

    describe("has", function() {
        it("should return the true value if the first value is found in the second value (array)", function() {
            var val1 = "hello",
                val2 = ["world", "fizz", "hello", "buzz"],
                returnTrue = "Success!",
                returnFalse = "Failure!",
                options = {};

            options.fn = function() { return returnTrue; };
            options.inverse = function() { return returnFalse; };

            expect(Handlebars.helpers.has(val1, val2, options)).toEqual(returnTrue);
        });

        it("should return the true value if the first value is not found in the second value (array)", function() {
            var val1 = "good bye",
                val2 = ["world", "fizz", "hello", "buzz"],
                returnTrue = "Success!",
                returnFalse = "Failure!",
                options = {};

            options.fn = function() { return returnTrue; };
            options.inverse = function() { return returnFalse; };

            expect(Handlebars.helpers.notHas(val1, val2, options)).toEqual(returnTrue);
        });

        it("should return the false value if the first value is found in the second value (array)", function() {
            var val1 = "hello",
                val2 = ["world", "fizz", "sidecar", "buzz"],
                returnTrue = "Success!",
                returnFalse = "Failure!",
                options = {};

            options.fn = function() { return returnTrue; };
            options.inverse = function() { return returnFalse; };

            expect(Handlebars.helpers.has(val1, val2, options)).toEqual(returnFalse);
        });

        it("should return the true value if the first value is found in the second value (scalar)", function() {
            var val1 = "hello",
                val2 = "hello",
                returnTrue = "Success!",
                returnFalse = "Failure!",
                options = {};

            options.fn = function() { return returnTrue; };
            options.inverse = function() { return returnFalse; };

            expect(Handlebars.helpers.has(val1, val2, options)).toEqual(returnTrue);
        });
    });

    describe("eachOptions", function() {
        it("should pull options hash from app list strings and return an iterated block string", function() {
            var optionName = "custom_fields_importable_dom",
                blockHtml = "<li>{{this.key}} {{this.value}}</li>",
                template = Handlebars.compile(blockHtml);

            app.metadata.set(fixtures.metadata);
            expect(Handlebars.helpers.eachOptions(optionName, {fn: template})).toEqual("<li>true Yes</li><li>false No</li><li>required Required</li>");
        });

        it("should pull options array from app list strings and return an iterated block string", function() {
            var optionName = "custom_fields_merge_dup_dom",
                blockHtml = "<li>{{value}}</li>",
                template;

            template = Handlebars.compile(blockHtml);

            expect(Handlebars.helpers.eachOptions(optionName, {fn: template})).toEqual("<li>Disabled</li><li>Enabled</li><li>In Filter</li><li>Default Selected Filter</li><li>Filter Only</li>");
        });

        it("should return an iterated block string for an object", function() {
            var options = {"Disabled": 0, "Enabled": 1},
                blockHtml = "<li>{{this.key}} {{this.value}}</li>",
                template;

            template = Handlebars.compile(blockHtml);

            expect(Handlebars.helpers.eachOptions(options, {fn: template})).toEqual("<li>Disabled 0</li><li>Enabled 1</li>");
        });

        it("should return an iterated block string for an array", function() {
            var options = ["Disabled", "Enabled"],
                blockHtml = "<li>{{value}}</li>",
                template;

            template = Handlebars.compile(blockHtml);

            expect(Handlebars.helpers.eachOptions(options, {fn: template})).toEqual("<li>Disabled</li><li>Enabled</li>");
        });

    });

    describe("eq", function() {
        it("should return the true value if conditional evaluates true", function() {
            var val1 = 1,
                val2 = 1,
                returnTrue = "Success!",
                returnFalse = "Failure!",
                options = {};

            options.fn = function() { return returnTrue; };
            options.inverse = function() { return returnFalse; };

            expect(Handlebars.helpers.eq(val1, val2, options)).toEqual(returnTrue);
        });

        it("should return the false value if conditional evaluates false", function() {
            var val1 = 1,
                val2 = 2,
                returnTrue = "Success!",
                returnFalse = "Failure!",
                options = {};

            options.fn = function() { return returnTrue; };
            options.inverse = function() { return returnFalse; };

            expect(Handlebars.helpers.eq(val1, val2, options)).toEqual(returnFalse);
        });
    });

    describe("notEq", function() {
        it("should return the false value if conditional evaluates true", function() {
            var val1 = 1,
                val2 = 1,
                returnTrue = "Success!",
                returnFalse = "Failure!",
                options = {};

            options.fn = function() { return returnTrue; };
            options.inverse = function() { return returnFalse; };

            expect(Handlebars.helpers.notEq(val1, val2, options)).toEqual(returnFalse);
        });

        it("should return the true value if conditional evaluates false", function() {
            var val1 = 1,
                val2 = 2,
                returnTrue = "Success!",
                returnFalse = "Failure!",
                options = {};

            options.fn = function() { return returnTrue; };
            options.inverse = function() { return returnFalse; };

            expect(Handlebars.helpers.notEq(val1, val2, options)).toEqual(returnTrue);
        });
    });

    describe("notMatch", function() {
        it("should return inverse of regex evaluation", function() {
            var val1 = "foo-is-not-greedy",
                nonGreedy = "^foo$", 
                greedy = "foo", 
                returnTrue = "Success!",
                returnFalse = "Failure!",
                options = {};

            options.fn = function() { return returnTrue; };
            options.inverse = function() { return returnFalse; };

            expect(Handlebars.helpers.notMatch(val1, nonGreedy, options)).toEqual(returnTrue);
            expect(Handlebars.helpers.notMatch(val1, greedy, options)).toEqual(returnFalse);
        });
    });
    
    describe("match", function() {
        it("should return result of regex evaluation", function() {
            var val1 = "foo-is-not-greedy",
                nonGreedy = "^foo$", 
                greedy = "foo", 
                returnTrue = "Success!",
                returnFalse = "Failure!",
                options = {};

            options.fn = function() { return returnTrue; };
            options.inverse = function() { return returnFalse; };

            expect(Handlebars.helpers.match(val1, nonGreedy, options)).toEqual(returnFalse);
            expect(Handlebars.helpers.match(val1, greedy, options)).toEqual(returnTrue);
        });
    });

    describe("isSortable", function() {
        it("should return block if isSortable is true in field viewdef", function() {
            var returnVal = 'Yup',
                block = function() {return returnVal; },
                module = "Cases", 
                fieldViewdef = { 
                    name: 'text',
                    sortable: true
                },
                getModuleStub = sinon.stub(app.metadata, 'getModule', function() { 
                    return {
                        fields: {
                            text: { 
                                sortable:false
                            }
                        }
                    };
                });
            expect(Handlebars.helpers.isSortable(module, fieldViewdef, { fn: block })).toEqual(returnVal);
            getModuleStub.restore();
        });

        it("should not return block if isSortable is false in field viewdef but true in vardef", function() {
            var returnVal = 'Yup',
                block = function() {return returnVal; },
                module = "Cases", 

                fieldViewdef = { 
                    name: 'text',
                    sortable: false
                },
                getModuleStub = sinon.stub(app.metadata, 'getModule', function() { 
                    return {
                        fields: {
                            text: { 
                                sortable: true
                            }
                        }
                    };
                });
            expect(Handlebars.helpers.isSortable(module, fieldViewdef, { fn: block })).not.toEqual(returnVal);
            getModuleStub.restore();
        });
        it("should return block if isSortable not defined in either field viewdef or vardef", function() {
            var returnVal = 'Yup',
                block = function() {return returnVal; },
                module = "Cases", 
                fieldViewdef = { 
                    name: 'text'
                },
                getModuleStub = sinon.stub(app.metadata, 'getModule', function() { 
                    return {
                        fields: {
                            text: {} 
                        }
                    };
                });
            expect(Handlebars.helpers.isSortable(module, fieldViewdef, { fn: block })).toEqual(returnVal);
            getModuleStub.restore();
        });
    });
    
    describe("str", function() {
        it("should get a string from language bundle", function() {
            var lang = SugarTest.app.lang;
            app.metadata.set(fixtures.metadata);
            expect(Handlebars.helpers.str("LBL_ASSIGNED_TO_NAME", "Contacts")).toEqual("Assigned to");
        });
    });

    describe("nl2br", function() {
        it("should convert newlines to breaks", function() {
            expect(Handlebars.helpers.nl2br("foo\nbar\r\nbaz\nbang")).toEqual(new Handlebars.SafeString("foo<br>bar<br>baz<br>bang"));
            expect(Handlebars.helpers.nl2br("\nbar\r\nbaz\n")).toEqual(new Handlebars.SafeString("<br>bar<br>baz<br>"));
        });
        it("should accept input without newlines", function() {
            expect(Handlebars.helpers.nl2br("foo")).toEqual(new Handlebars.SafeString("foo"));
            expect(Handlebars.helpers.nl2br("")).toEqual(new Handlebars.SafeString(""));
            expect(Handlebars.helpers.nl2br("\\n")).toEqual(new Handlebars.SafeString("\\n"));
            expect(Handlebars.helpers.nl2br("\\r\\n")).toEqual(new Handlebars.SafeString("\\r\\n"));
        });
        it("should gracefully handle non-string values", function(){
            expect(Handlebars.helpers.nl2br(undefined)).toEqual("");
            expect(Handlebars.helpers.nl2br({not: "a string"})).toEqual("");
            expect(Handlebars.helpers.nl2br(3)).toEqual("");
        });
        it("should not allow HTML to be injected", function(){
            expect(Handlebars.helpers.nl2br("<b>Boldly</b>")).toEqual(new Handlebars.SafeString("&lt;b&gt;Boldly&lt;/b&gt;"));
            expect(Handlebars.helpers.nl2br("<script type='text/javascript'></script>")).toEqual(new Handlebars.SafeString("&lt;script type='text/javascript'&gt;&lt;/script&gt;"));
        })
    });

    describe("formatCurrency", function() {
        it("should format the value to a currency format", function() {
            user.set('decimal_precision',2);
            user.set('decimal_separator','.');
            user.set('number_grouping_separator',',');
            var amount = 1999.99,
                currencyId = "-99";
            expect(Handlebars.helpers.formatCurrency(amount, currencyId)).toEqual("$1,999.99");
        });
    });

    describe("firstChars", function() {
        it("should return the first n chars of a string", function() {
            var str = "longstring",
                length = 3;

            expect(Handlebars.helpers.firstChars(str, length)).toEqual("lon");
        });
    });
});
