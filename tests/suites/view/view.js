describe("View.View", function() {
    var app, bean, collection, context, views;

    beforeEach(function() {
        SugarTest.seedMetadata(true);
        app = SugarTest.app;

        bean = app.data.createBean("Contacts", {
            first_name: "Foo",
            last_name: "Bar"
        });
        bean.fields = fixtures.metadata.modules.Contacts.fields;
        collection = new app.BeanCollection([bean]);
        context = app.context.getContext({
            url: "someurl",
            module: "Contacts",
            model: bean,
            collection: collection
        });
    });

    it('should render edit views', function() {
        var aclSpy = sinon.spy(app.acl,'hasAccess'), html,
            view = SugarTest.createComponent("View", {
                context: context,
                name: "edit"
            });

        view.render();
        html = view.$el.html();
        expect(html).toContain('edit');

        expect(view.$el.find('input[value="Foo"]').length).toEqual(1);
        expect(aclSpy).toHaveBeenCalled();
        aclSpy.restore();
    });

    it('should render detail views', function() {
        var view = SugarTest.createComponent("View", {
                context: context,
                name: "detail"
            }), html;
        view.render();
        expect(view.moduleSingular).toEqual("Kontact");
        expect(view.modulePlural).toEqual("Kontacts");
        html = view.$el.html();
        expect(html).toContain('detail');
    });

    it('should render with custom context for its template', function() {
        app.view.views.CustomView = app.view.View.extend({
            _renderHtml: function() {
                app.view.View.prototype._renderHtml.call(this, { prop: "kommunizma"});
            }
        });
        var view = SugarTest.createComponent("View", {
                context: context,
                name: "custom"
            }), html;

        view.template = Handlebars.compile("K pobede {{prop}}!");
        view.render();
        html = view.$el.html();
        expect(html).toContain('K pobede kommunizma!');
    });

   it('should return its fields, related fields and dispose them when re-rendering', function(){
        var view = SugarTest.createComponent("View", {
                context: context,
                name: "detail"
            }),
            fields = [ 'first_name', 'last_name', 'phone_work', 'phone_home', 'email1', 'account_name', 'parent_name', 'date_modified' ],
            mock = sinon.mock(app.view.Field.prototype);

        mock.expects("dispose").exactly(11);

        //getFieldName should returns its related fields
        expect(view.getFieldNames()).toEqual([ 'first_name', 'last_name', 'phone_work', 'phone_home', 'email1', 'account_name', 'parent_name', 'date_modified', 'modified_by_name', 'account_id', 'parent_id', 'parent_type']);

        expect(_.isEmpty(view.getFields())).toBeTruthy();
        expect(_.isEmpty(view.fields)).toBeTruthy();

        view.render();

        expect(_.keys(view.fields).length).toEqual(11);
        expect(_.pluck(view.getFields(), "name")).toEqual(fields);

        // Make sure the number of fields is still the same
        view.render();

        expect(_.keys(view.fields).length).toEqual(11);
        expect(_.pluck(view.getFields(), "name")).toEqual(fields);
        mock.verify();
    });

    it('should only load data when the user has read access for the View\'s module', function(){
        var aclSpy = sinon.spy(app.acl,'hasAccess'),
            // Function that makes API call to load Fields defined in View
            loadStub = sinon.stub(context,'loadData', function(){
                return;
            }),
            view = SugarTest.createComponent("View", {
                context: context,
                name: "details",
                module: "Bugs"
            });

        view.loadData();
        expect(aclSpy).toHaveBeenCalledWith('read','Bugs');
        expect(loadStub).toHaveBeenCalled();
        aclSpy.restore();
        loadStub.reset();

        var hasAccessStub = sinon.stub(app.acl,"hasAccess",function(access, module) {
            return false;
        });
        view.loadData();
        expect(aclSpy).toHaveBeenCalledWith('read','Bugs');
        expect(loadStub).not.toHaveBeenCalled();
        hasAccessStub.restore();
        loadStub.restore();
    });

    it('should occur an error dialog only if the primary view has not rendered due to the acl failure', function(){
        var hasAccessStub = sinon.stub(app.acl,"hasAccessToModel",function(action, model) {
                return false;
            }),
            view = SugarTest.createComponent("View", {
                context: context,
                name: "details",
                module: "Bugs",
                primary: true
            }),
            errorSpy = sinon.spy(app.error,'handleRenderError');

        view.render();
        expect(errorSpy).toHaveBeenCalled();
        errorSpy.restore();

        errorSpy = sinon.spy(app.error,'handleRenderError');
        view.primary = false;
        expect(errorSpy).not.toHaveBeenCalled();

        hasAccessStub.restore();
        errorSpy.restore();
    });

    it('should get use template if available', function(){
        var options, view, actual, getViewStub;
        getViewStub = sinon.stub(app.template, 'getView').returns('bar');
        options = {
            meta: {template: 'foo'}
        };
        view = SugarTest.createComponent("View", {
            context: context,
            name: "detail"
        });
        actual = view.getTemplateFromMeta(options);
        expect(actual).toEqual('bar');
        expect(getViewStub).toHaveBeenCalledWith('foo');
        getViewStub.restore();
    });

    it('should get use template but return null if falsy', function(){
        var options, view, actual;
        options = {meta: undefined};
        view = SugarTest.createComponent("View", {
            context: context,
            name: "detail"
        });
        actual = view.getTemplateFromMeta(options);
        expect(actual).toBeFalsy();
        options = {
            meta: {template: undefined}
        };
        actual = view.getTemplateFromMeta(options);
        expect(actual).toBeFalsy();
    });
});
