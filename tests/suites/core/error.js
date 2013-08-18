describe("Error module", function() {
    var app;

    beforeEach(function() {
        SugarTest.seedMetadata(true);
        app = SugarTest.app;
        SugarTest.seedFakeServer();
    });

    it("should inject custom http error handlers and should handle http code errors", function() {
        var bean = app.data.createBean("Cases"),
            handled = false, statusCodes;

        // The reason we don't use a spy in this case is because
        // the status codes are copied instead of passed in by
        // by reference, thus the spied function will never be called.
        statusCodes = {
            404: function() {
                handled = true;
            }
        };

        app.error.initialize({statusCodes: statusCodes});

        sinon.spy(app.error, "handleHttpError");
        SugarTest.server.respondWith([404, {}, ""]);
        bean.save();
        SugarTest.server.respond();
        expect(handled).toBeTruthy();
        expect(app.error.handleHttpError.called).toBeTruthy();

        app.error.handleHttpError.restore();
    });

    it("should handle validation errors", function() {
        var bean, flag = false, spy;

        // Set the length arbitrarily low to force validation error
        app.data.declareModel("Cases", fixtures.metadata.modules.Cases);
        bean = app.data.createBean("Cases");
        bean.fields.name.len = 1;

        app.error.initialize();
        sinon.spy(app.error, "handleValidationError");

        bean.set({name: "This is a test"});
        spy = sinon.spy(bean, "trigger");
        bean.save(null, { fieldsToValidate: ['name']});
        waitsFor(function() {
            return spy.called;
        });
        runs(function() {
            expect(app.error.handleValidationError.called).toBeTruthy();
            app.error.handleValidationError.restore();
            spy.restore();
        });

    });

    it("overloads window.onerror", function() {
        // Remove on error
        window.onerror = false;

        // Initialize error module
        app.error.overloaded = false;
        app.error.initialize();

        // Check to see if onerror was overloaded
        expect(_.isFunction(window.onerror)).toBeTruthy();
    });

    it("should get error strings", function(){
        var errorKey = "ERROR_TEST";
        var context = "10";
        var string = app.error.getErrorString(errorKey, context);
        expect(string).toEqual("Some error string 10");
    });

    it("should call handleInvalidGrantError callback if available, or, resort to fallback", function() {
        var spyHandleInvalidGrantError, spyFallbackHandler, xhr;
        app.error.handleInvalidGrantError = function() {};
        spyHandleInvalidGrantError = sinon.spy(app.error, 'handleInvalidGrantError');
        xhr = {
            responseText: '{"error": "invalid_grant", "error_description": "some desc"}',
            status: '400',
            getResponseHeader: function() { return "application/json"}
        };
        var request = { xhr: xhr };
        var error = new SUGAR.Api.HttpError(request);
        app.error.handleHttpError(error);
        expect(spyHandleInvalidGrantError.called).toBeTruthy();

        // Now try with it undefined and the fallback should get called
        app.error.handleInvalidGrantError = undefined;
        spyFallbackHandler = sinon.spy(app.error, 'handleStatusCodesFallback');
        app.error.handleHttpError(xhr);
        expect(spyHandleInvalidGrantError).not.toHaveBeenCalledTwice();
        expect(spyFallbackHandler.called).toBeTruthy();
        spyFallbackHandler.restore();
    });
    
    it("should call handleInvalidClientError callback if available, or, resort to fallback", function() {
        var spyHandleInvalidClientError, spyFallbackHandler, xhr;
        app.error.handleInvalidClientError = function() {};
        spyHandleInvalidClientError = sinon.spy(app.error, 'handleInvalidClientError');
        xhr = {
            responseText: '{"error": "invalid_client", "error_description": "some desc"}',
            status: '400',
            getResponseHeader: function() { return "application/json"}
        };
        var request = { xhr: xhr };
        var error = new SUGAR.Api.HttpError(request);
        app.error.handleHttpError(error);
        expect(spyHandleInvalidClientError.called).toBeTruthy();

        // Now try with it undefined and the fallback should get called
        app.error.handleInvalidClientError = undefined;
        spyFallbackHandler = sinon.spy(app.error, 'handleStatusCodesFallback');
        app.error.handleHttpError(xhr);
        expect(spyHandleInvalidClientError).not.toHaveBeenCalledTwice();
        expect(spyFallbackHandler.called).toBeTruthy();
        spyFallbackHandler.restore();
    });

    it("should call handleForbiddenError callback on 403 if available, or, resort to fallback", function() {
        var spyHandleForbiddenError, spyFallbackHandler, xhr;
        app.error.handleForbiddenError = function() {};
        spyHandleForbiddenError = sinon.spy(app.error, 'handleForbiddenError');
        xhr = {
            status: '403',
            responseText: '{"error":"fubar"}',
            getResponseHeader: function() { return "application/json" }
        };
        var request = { xhr: xhr };
        app.error.handleHttpError(new SUGAR.Api.HttpError(request));
        expect(spyHandleForbiddenError.called).toBeTruthy();

        // Now try with it undefined and the fallback should get called
        app.error.handleForbiddenError = undefined;
        spyFallbackHandler = sinon.spy(app.error, 'handleStatusCodesFallback');
        app.error.handleHttpError(new SUGAR.Api.HttpError(request));
        expect(spyHandleForbiddenError).not.toHaveBeenCalledTwice();
        expect(spyFallbackHandler.called).toBeTruthy();
        spyFallbackHandler.restore();
    });
    

});
