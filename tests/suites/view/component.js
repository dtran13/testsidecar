describe("View.Component", function() {
    var app;

    beforeEach(function() {
        SugarTest.seedMetadata(true);
        app = SugarTest.app;
    });

    it("should add a css class when specified", function() {
        var layout = SugarTest.createComponent("Layout", {
            name: "tree",
            module: "Taxonomy",
            meta: {
                css_class: "test"
            }
        });
        expect(layout.$el.hasClass("test")).toBeTruthy();
    });

    it("should add multiple css classes when specified", function() {
        var layout = SugarTest.createComponent("Layout", {
            name: "tree",
            module: "Taxonomy",
            meta: {
                css_class: "test1 test2"
            }
        });
        expect(layout.$el.hasClass("test1")).toBeTruthy();
        expect(layout.$el.hasClass("test2")).toBeTruthy();
    });

    it("should not add css classes when none are specified", function() {
        var layout = SugarTest.createComponent("Layout", {
            name: "tree",
            module: "Taxonomy",
            meta: []
        });
        expect(layout.$el.hasClass("test")).toBeFalsy();
        expect(layout.$el.hasClass("undefined")).toBeFalsy();
    });


    it("should register before handelers", function() {
        var layout = SugarTest.createComponent("Layout", {
            name: "tree",
            module: "Taxonomy",
            meta: []
        });

        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        layout.before("render", spy1);
        layout.before("render", spy2);
        layout.render();

        expect(spy1).toHaveBeenCalled();
        expect(spy2).toHaveBeenCalled();
    });


    it("should unregister all before handelers", function() {
        var layout = SugarTest.createComponent("Layout", {
            name: "tree",
            module: "Taxonomy",
            meta: []
        });

        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        layout.before("render", spy1);
        layout.before("render", spy2);
        layout.offBefore();
        layout.render();
        expect(spy1).not.toHaveBeenCalled();
        expect(spy2).not.toHaveBeenCalled();
    });

    it("should unregister a specific before handeler", function() {
        var layout = SugarTest.createComponent("Layout", {
            name: "tree",
            module: "Taxonomy",
            meta: []
        });

        var spy1 = sinon.spy();
        var spy2 = sinon.spy();
        layout.before("render", spy1);
        layout.before("render", spy2);
        layout.offBefore("render", spy1);
        layout.render();
        expect(spy1).not.toHaveBeenCalled();
        expect(spy2).toHaveBeenCalled();
    });

    it("should fire a before handler with scope", function() {
        var layout = SugarTest.createComponent("Layout", {
            name: "tree",
            module: "Taxonomy",
            meta: []
        });

        var context = {};
        layout.before("render", function() {
            this.foo = "bar";
        }, context, true);
        layout.render();
        expect(context.foo).toEqual("bar");
    });


    it("should fire a before handler with params", function() {
        var layout = SugarTest.createComponent("Layout", {
            name: "tree",
            module: "Taxonomy",
            meta: []
        });

        var params = {foo: "bar"};
        var spy = sinon.spy();
        layout.before("render", spy, params);
        layout.render();
        expect(spy).toHaveBeenCalledWith(params);
    });

    it("should log error if component disposed", function() {
        var layout = SugarTest.createComponent("Layout", {
            name: "tree"
        });
        var spy = sinon.spy(layout, "_render");
        var stub = sinon.stub(app.logger, "error");
        //Nominal case
        layout.render();
        expect(stub).not.toHaveBeenCalled();
        expect(spy).toHaveBeenCalled();
        stub.reset();
        spy.reset();
        //Disposed case
        layout.disposed = true;
        layout.render();
        expect(stub).toHaveBeenCalled();
        expect(spy).not.toHaveBeenCalled();
    });


    it("should not render when before render is false", function() {
        var layout = SugarTest.createComponent("Layout", {
            name: "tree",
            module: "Taxonomy",
            meta: []
        });

        var spy = sinon.spy(layout, "_render");
        layout.before("render", function() {
            return false;
        });
        layout.render();
        expect(spy).not.toHaveBeenCalled();
    });

    it("should not render when before render is false, even when one callback returns true", function() {
        var layout = SugarTest.createComponent("Layout", {
            name: "tree",
            module: "Taxonomy",
            meta: []
        });

        var spy = sinon.spy(layout, "_render");
        layout.before("render", function() {
            return false;
        });
        layout.before("render", function() {
            return true;
        });
        layout.render();
        expect(spy).not.toHaveBeenCalled();
    });

    it("should hide and show the base element", function() {
        var layout = SugarTest.createComponent("Layout", {
            name: "tree",
            module: "Taxonomy",
            meta: {}
        });

        layout.hide();
        expect($(layout.$el).css("display") == "none").toEqual(true);
        expect($(layout.$el).hasClass("hide")).toEqual(true);
        expect(layout.isVisible()).toEqual(false);
        layout.show();
        expect($(layout.$el).css("display") != "none").toEqual(true);
        expect($(layout.$el).hasClass("hide")).toEqual(false);
        expect(layout.isVisible()).toEqual(true);
    });

    it('should remove this.layout and this.context events', function() {
        var parentLayout = SugarTest.createComponent("Layout", {
            name: "tree",
            module: "Taxonomy",
            meta: []
        });
        var layout = SugarTest.createComponent("Layout", {
            name: "tree",
            module: "Taxonomy",
            layout: parentLayout,
            meta: []
        });
        var stubLayoutOff = sinon.spy(parentLayout, "off");
        var context = app.context.getContext({});
        var stubContextOff = sinon.spy(context, "off");
        layout.context = context;

        layout.dispose();

        expect(stubLayoutOff).toHaveBeenCalled();
        expect(stubContextOff).toHaveBeenCalled();
    });

    it("should null out this.el and this.$el once a component has been disposed", function() {
        var layout = SugarTest.createComponent("Layout", {
            name: "tree",
            module: "Taxonomy",
            meta: {}
        });

        expect(layout.el).not.toBeNull();
        expect(layout.$el).not.toBeNull();

        layout.dispose();

        expect(layout.el).toBeNull();
        expect(layout.$el).toBeNull();
    });


    it("should invoke the parent chain correctly", function() {
        app.view.declareComponent("layout", "class1", null, {
            foo: function() {
                return "foo";
            }
        }, true, "base");
        app.view.declareComponent("layout", "class2", null, {
            extendsFrom: 'Class1Layout',
            foo: function() {
                return this._super("foo") + "bar";
            }
        }, true, "base");
        app.view.declareComponent("layout", "class3", null, {
            extendsFrom: 'Class2Layout',
            foo: function() {
                return this._super("foo") + "baz";
            }
        }, true, "base");

        var testInstance = new app.view.layouts.BaseClass3Layout({});

        expect(testInstance.foo()).toEqual("foobarbaz");

        delete app.view.layouts['BaseClass1Layout'];
        delete app.view.layouts['BaseClass2Layout'];
        delete app.view.layouts['BaseClass3Layout'];
    });


    it("should work when components mix invoke parent and super", function() {
        app.view.declareComponent("layout", "myBaseLayout", null, {
            foo: function() {
                return "base";
            }
        }, true, "base");
        app.view.declareComponent("layout", "class1", null, {
            extendsFrom: 'MyBaseLayoutLayout',
            foo: function() {
                return this._super("foo") + "foo";
            }
        }, true, "base");
        app.view.declareComponent("layout", "class2", null, {
            extendsFrom: 'Class1Layout',
            foo: function() {
                return app.view.invokeParent(this, {
                    type: "layout",
                    name: "class1",
                    method: "foo"
                }) + "bar";
            }
        }, true, "base");
        app.view.declareComponent("layout", "class3", null, {
            extendsFrom: 'Class2Layout',
            foo: function() {
                return this._super("foo") + "baz";
            }
        }, true, "base");

        var testInstance = new app.view.layouts.BaseClass3Layout({});

        expect(testInstance.foo()).toEqual("basefoobarbaz");

        delete app.view.layouts['BaseMyBaseLayoutLayout'];
        delete app.view.layouts['BaseClass1Layout'];
        delete app.view.layouts['BaseClass2Layout'];
        delete app.view.layouts['BaseClass3Layout'];
    });
});
