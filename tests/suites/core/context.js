describe("Context", function() {
    var app;

    beforeEach(function() {
        SugarTest.seedMetadata();
        app = SugarTest.app;
    });

    it("should return a new context object", function() {
        var context = app.context.getContext({});
        expect(context.attributes).toEqual({});
    });

    it("should return properties", function() {
        var context = app.context.getContext({
            prop1: "Prop1",
            prop2: "Prop2",
            prop3: "Prop3"
        });
        expect(context.get("prop1")).toEqual("Prop1");
        expect(context.attributes).toEqual({prop1: "Prop1", prop2: "Prop2", prop3: "Prop3"});
    });

    it("should prepare data for a module path", function() {
        var context = app.context.getContext({module:'Contacts'});
        expect(context.attributes.model).toBeUndefined();
        expect(context.attributes.collection).toBeUndefined();

        context.prepare();

        expect((context.attributes.model instanceof Backbone.Model)).toBeTruthy();
        expect((context.attributes.collection instanceof Backbone.Collection)).toBeTruthy();

        expect(context.attributes.model.module).toEqual("Contacts");
        expect(context.attributes.collection.module).toEqual("Contacts");
    });

    it("should prepare data for a global search", function() {
        var context = app.context.getContext({
            mixed: true,
            module_list: ["Accounts","Contacts"]
        });
        expect(context.attributes.collection).toBeUndefined();

        context.prepare();
        expect((context.attributes.collection instanceof app.MixedBeanCollection)).toBeTruthy();

        var collection = context.attributes.collection;
        var mock = sinon.mock(collection).expects("fetch").once().withArgs({
            module_list: ["Accounts","Contacts"],
            someOption: "xxx"
        });

        context.loadData({ someOption: "xxx"});
        mock.verify();
    });

    it("should not load data if we set skipFetch", function() {
        var context = app.context.getContext({
            module: 'Cases',
            skipFetch: true
        });

        context.prepare();

        var collection = context.attributes.collection;
        var mock = sinon.mock(collection).expects("fetch").never();

        context.loadData({ someOption: "xxx"});
        mock.verify();
    });

    it("should prepare data for a record path", function() {
        var context = app.context.getContext({
            modelId: '123',
            module: 'Cases'
        });

        context.prepare();

        expect(context.attributes.model).toBeDefined();
        expect(context.attributes.model.id).toEqual("123");
        expect(context.isCreate()).toBeFalsy();
    });

    it("should prepare data for a create path", function() {
        var context = app.context.getContext({
            create: true,
            module: 'Cases'
        });

        context.prepare();

        expect(context.get("module")).toEqual('Cases');
        expect(context.get("model") instanceof app.Bean).toBeTruthy();
        expect(context.get("model").isNew()).toBeTruthy();
        expect(context.isCreate()).toBeTruthy();
    });

    it("should load data for a module path", function() {
        var collection = app.data.createBeanCollection("Cases");
        var context = app.context.getContext({
            collection: collection,
            module: 'Cases'
        });

        var mock = sinon.mock(collection).expects("fetch").once();
        context.loadData();

        mock.verify();
    });

    it("should load data for a record path", function() {
        var model = app.data.createBean("Cases", { id: "xyz" });
        var context = app.context.getContext({
            model: model,
            module: 'Cases',
            modelId: 'xyz'
        });

        var mock = sinon.mock(model).expects("fetch").once();
        context.loadData();

        mock.verify();
    });

    it("should set the order by on collection if defined in config", function() {
        var collection = app.data.createBeanCollection("Cases");

        var context = app.context.getContext({
            module: 'Cases',
            collection: collection
        });
        app.config.orderByDefaults = {
            'Cases': {
                field: 'case_number',
                direction: 'asc'
            }
        };

        // Prevent outgoing http request
        var stub = sinon.stub($, 'ajax');
        context.loadData();
        stub.restore();

        expect(context.get('collection').orderBy).toBeDefined();
        expect(context.get('collection').orderBy.field).toEqual('case_number');
        expect(context.get('collection').orderBy.direction).toEqual('asc');
    });

    it("should maintain order by if already set on collection event if defined in config", function() {
        var collection = app.data.createBeanCollection("Cases");
        collection.orderBy = {
                field: 'fooby',
                direction: 'updownallaround'
            };

        var context = app.context.getContext({
            module: 'Cases',
            collection: collection
        });

        app.config.orderByDefaults = {
            'Cases': {
                field: 'case_number',
                direction: 'asc'
            }
        };

        // Prevent outgoing http request
        var stub = sinon.stub($, 'ajax');
        context.loadData();
        stub.restore();

        expect(context.get('collection').orderBy).toBeDefined();
        expect(context.get('collection').orderBy.field).toEqual('fooby');
        expect(context.get('collection').orderBy.direction).toEqual('updownallaround');
    });

    it("should prepare data for a link path", function() {
        var context = app.context.getContext({
            link: "contacts",
            parentModelId: 'xyz',
            parentModule: "Opportunities"
        });
        context.prepare();

        expect(context.get("parentModel")).toBeDefined();
        expect(context.get("parentModel").module).toEqual("Opportunities");
        expect(context.get("parentModel").id).toEqual("xyz");

        expect(context.get("collection")).toBeDefined();
        expect(context.get("collection").module).toEqual("Contacts");
        expect(context.get("collection").link).toBeDefined();
        expect(context.get("collection").link.name).toEqual("contacts");
        expect(context.get("collection").link.bean).toEqual(context.get("parentModel"));
    });

    it("should prepare data for a link path with pre-filled parent model", function() {
        var context = app.context.getContext({
            link: "contacts",
            parentModel: app.data.createBean("Opportunities", { id: "xyz "})
        });

        context.prepare();

        expect(context.get("collection")).toBeDefined();
        expect(context.get("collection").module).toEqual("Contacts");
        expect(context.get("collection").link).toBeDefined();
        expect(context.get("collection").link.name).toEqual("contacts");
        expect(context.get("collection").link.bean).toEqual(context.get("parentModel"));
    });

    it("should prepare data for a related record path", function() {
        var context = app.context.getContext({
            link: "contacts",
            parentModelId: 'xyz',
            parentModule: "Opportunities",
            modelId: 'asd'
        });

        context.prepare();

        expect(context.get("parentModel")).toBeDefined();
        expect(context.get("parentModel").module).toEqual("Opportunities");
        expect(context.get("parentModel").id).toEqual("xyz");

        expect(context.get("model")).toBeDefined();
        expect(context.get("model").module).toEqual("Contacts");
        expect(context.get("model").id).toEqual("asd");
        expect(context.get("model").link).toBeDefined();
        expect(context.get("model").link.name).toEqual("contacts");
        expect(context.get("model").link.bean).toEqual(context.get("parentModel"));
        expect(context.get("model").link.isNew).toBeTruthy();
    });

    it("should prepare data for a create related record path", function() {
        var context = app.context.getContext({
            link: "contacts",
            parentModelId: 'xyz',
            parentModule: "Opportunities",
            create: true
        });

        context.prepare();

        expect(context.get("parentModel")).toBeDefined();
        expect(context.get("parentModel").module).toEqual("Opportunities");
        expect(context.get("parentModel").id).toEqual("xyz");

        expect(context.get("model")).toBeDefined();
        expect(context.get("model").module).toEqual("Contacts");
        expect(context.get("model").isNew()).toBeTruthy();
        expect(context.get("model").link).toBeDefined();
        expect(context.get("model").link.name).toEqual("contacts");
        expect(context.get("model").link.bean).toEqual(context.get("parentModel"));
        expect(context.get("model").link.isNew).toBeTruthy();
    });

    it("should not reset child contexts during resetLoadFlag when recursive is false", function() {
        var parent = app.context.getContext({module: "Opportunities"}),
            mock = {resetLoadFlag: sinon.stub()};
        parent.children.push(mock);
        parent.resetLoadFlag(false);
        expect(mock.resetLoadFlag).not.toHaveBeenCalled();
        parent.resetLoadFlag();
        expect(mock.resetLoadFlag).toHaveBeenCalled();
    });

    it("should remove all events when clearing a context", function() {
        var context = app.context.getContext({
            modelId: '123',
            module: 'Cases'
        });
        context.prepare();

        var childContext = app.context.getContext({
            modelId: '456',
            module: 'Contacts'
        });
        childContext.prepare();

        context.children.push(childContext);
        childContext.parent = context;

        var contextCollection = context.get('collection'),
            contextModel = context.get('model'),
            childContextCollection = childContext.get('collection'),
            childContextModel = childContext.get('model');

        context.clear();

        expect(_.size(context._events)).toBe(0);
        expect(_.size(contextCollection._events)).toBe(0);
        expect(_.size(contextModel._events)).toBe(0);
        expect(_.size(childContext._events)).toBe(0);
        expect(_.size(childContextCollection._events)).toBe(0);
        expect(_.size(childContextModel._events)).toBe(0);
    });

    describe("Child context", function() {

        it("should create and prepare child contexts from a parent model", function() {
            var model = app.data.createBean("Opportunities", { id: "xyz"});
            var context = app.context.getContext({
                module: "Opportunities",
                model: model
            });

            var subcontext = context.getChildContext({ module: "Contacts" });

            expect(context.children.length).toEqual(1);
            expect(subcontext.parent).toEqual(context);
            expect(subcontext.get("module")).toEqual("Contacts");

            var subcontext2 = context.getChildContext({ module: "Contacts" });
            expect(subcontext).toEqual(subcontext2);

            expect(context.children.length).toEqual(1);

            subcontext.prepare();
            expect(subcontext.get("model")).toBeDefined();
            expect(subcontext.get("module")).toEqual("Contacts");

            context.clear();
            expect(context.children.length).toEqual(0);
            expect(context.parent).toBeNull();
        });

        it("should create and prepare child contexts from a link name", function() {
            var model = app.data.createBean("Opportunities", { id: "xyz"});
            var context = app.context.getContext({
                module: "Opportunities",
                model: model
            });

            var subrelatedContext = context.getChildContext({ link: "contacts" });

            expect(context.children.length).toEqual(1);

            expect(subrelatedContext.parent).toEqual(context);
            expect(subrelatedContext.get("link")).toEqual("contacts");
            expect(subrelatedContext.get("parentModel")).toEqual(model);

            var subrelatedContext2 = context.getChildContext({ link: "contacts" });
            expect(subrelatedContext).toEqual(subrelatedContext2);

            expect(context.children.length).toEqual(1);

            subrelatedContext.prepare();

            expect(subrelatedContext.get("model")).toBeDefined();
            expect(subrelatedContext.get("model").module).toEqual("Contacts");
            expect(subrelatedContext.get("parentModule")).toEqual("Opportunities");
            expect(subrelatedContext.get("module")).toEqual("Contacts");

            context.clear();
            expect(context.children.length).toEqual(0);

            subrelatedContext.clear();
            expect(context.parent).toBeNull();
        });

        it("should create and prepare a new child context when forceNew attribute is set to true and child context with same module name exists", function() {
            var model = app.data.createBean("Opportunities", { id: "xyz"}),
                context = app.context.getContext({
                    module: "Opportunities",
                    model: model
                }),
                childContext = context.getChildContext({
                    module: 'Opportunities',
                    prop1: "Prop1",
                    prop2: "Prop2",
                    prop3: "Prop3"
                });

            expect(childContext.get("prop1")).toEqual("Prop1");
            expect(childContext.attributes).toEqual({module: 'Opportunities', prop1: "Prop1", prop2: "Prop2", prop3: "Prop3"});

            expect(context.children.length).toEqual(1);

            var childContext2 = context.getChildContext({
                module: 'Opportunities',
                forceNew: true
            });

            expect(childContext2.attributes).toEqual({module : 'Opportunities'});

            expect(context.children.length).toEqual(2);
        });

        it("should return existing child context when context with module name exists", function() {
            var model = app.data.createBean("Opportunities", { id: "xyz"}),
                context = app.context.getContext({
                    module: "Opportunities",
                    model: model
                }),
                childContext = context.getChildContext({
                    module: 'Opportunities',
                    prop1: "Prop1",
                    prop2: "Prop2",
                    prop3: "Prop3"
                });

            expect(childContext.get("prop1")).toEqual("Prop1");
            expect(childContext.attributes).toEqual({module: 'Opportunities', prop1: "Prop1", prop2: "Prop2", prop3: "Prop3"});

            expect(context.children.length).toEqual(1);

            var childContext2 = context.getChildContext({
                module: 'Opportunities'
            });

            expect(childContext2.get("prop1")).toEqual("Prop1");
            expect(childContext2.attributes).toEqual({module: 'Opportunities', prop1: "Prop1", prop2: "Prop2", prop3: "Prop3"});

            expect(context.children.length).toEqual(1);
        });

        it("should return existing child context when context with matching cid exists", function() {
            var model = app.data.createBean("Opportunities", { id: "xyz"}),
                context = app.context.getContext({
                    module: "Opportunities",
                    model: model
                }),
                childContext = context.getChildContext({
                    module: 'Opportunities',
                    prop1: "Prop1",
                    prop2: "Prop2",
                    prop3: "Prop3"
                });

            expect(childContext.get("prop1")).toEqual("Prop1");
            expect(childContext.attributes).toEqual({module: 'Opportunities', prop1: "Prop1", prop2: "Prop2", prop3: "Prop3"});

            expect(context.children.length).toEqual(1);

            var childContext2 = context.getChildContext({
                cid: childContext.cid
            });

            expect(childContext2.get("prop1")).toEqual("Prop1");
            expect(childContext2.attributes).toEqual({module: 'Opportunities', prop1: "Prop1", prop2: "Prop2", prop3: "Prop3"});

            expect(context.children.length).toEqual(1);
        });

        it("should fire an event when a child context is added", function() {
            var model = app.data.createBean("Opportunities", { id: "xyz"}),
                context = app.context.getContext({
                    module: "Opportunities",
                    model: model
                }),
                childContext,
                mock = sinon.mock(context);

            mock.expects("trigger").once().calledWith("context:child:add");

            childContext = context.getChildContext({
                module: 'Opportunities',
                prop1: "Prop1",
                prop2: "Prop2",
                prop3: "Prop3"
            });

            mock.verify();
        });
    });

    it("should be able to indicate is data has been loaded", function() {
        var context = app.context.getContext({module:'Contacts'});
        context.prepare();

        expect((context.attributes.model instanceof Backbone.Model)).toBeTruthy();
        expect((context.attributes.collection instanceof Backbone.Collection)).toBeTruthy();

        expect(context.isDataFetched()).toBeFalsy();
        context.attributes.collection.dataFetched = true;
        expect(context.isDataFetched()).toBeTruthy();
        context.resetLoadFlag();
        expect(context.isDataFetched()).toBeFalsy();
    });
});
