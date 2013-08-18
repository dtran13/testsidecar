describe("File", function() {
    var file, viewNoFileInputs, viewOneFileInput, viewTwoFileInputs, getFieldValueStub;

    beforeEach(function() {
        file = SugarTest.app.file;

        viewNoFileInputs = new Backbone.View();
        viewNoFileInputs.$el = $('<div>no file inputs</div>');

        viewOneFileInput = new Backbone.View();
        viewOneFileInput.$el = $('<div><input type="file" name="field1" data-mockval="C:\\fakepath\\foo.txt"/></div>');

        viewTwoFileInputs = new Backbone.View();
        viewTwoFileInputs.$el = $('<div><input type="file" name="field1" data-mockval="C:\\fakepath\\foo.txt"/><input type="file" name="field2" data-mockval="C:\\fakepath\\bar.txt"/></div>');

        getFieldValueStub = sinon.stub($.fn, 'val', function() {return this.data('mockval');})
    });

    afterEach(function () {
        viewNoFileInputs = null;
        viewOneFileInput = null;
        viewTwoFileInputs = null;
        getFieldValueStub.restore();
    });

    describe("checkFileFieldsAndProcessUpload", function() {
        var getAttachmentFieldsStub, recursiveFileUploadStub;

        beforeEach(function() {
            getAttachmentFieldsStub = sinon.stub(file, '_getAttachmentFields', function(view) {
                return view.$(":file");
            });
            recursiveFileUploadStub = sinon.stub(file, '_recursiveFileUpload');
        });

        afterEach(function () {
            getAttachmentFieldsStub.restore();
            recursiveFileUploadStub.restore();
        });

        it("should upload files if any found on the view", function() {
            file.checkFileFieldsAndProcessUpload(viewOneFileInput);
            expect(recursiveFileUploadStub.callCount).toBe(1);
        });

        it("should do nothing if no file fields on view and no callbacks", function () {
            file.checkFileFieldsAndProcessUpload(viewNoFileInputs);
            expect(recursiveFileUploadStub.callCount).toBe(0);
        });

        it("should call success callback if no file fields on view", function () {
            var successCallback = sinon.stub(),
                callbacks = {success:successCallback};

            file.checkFileFieldsAndProcessUpload(viewNoFileInputs, callbacks);
            expect(recursiveFileUploadStub.callCount).toBe(0);
            expect(successCallback.callCount).toBe(1);
        });
    });

    describe("recursiveFileUpload", function () {
        var model, uploadFileStub, isUploadSuccess, successCallback, errorCallback, callbacks, triggerFieldValidationErrorStub;

        beforeEach(function () {
            model = new Backbone.Model();
            model.set('id', '123');
            model.uploadFile = $.noop;
            isUploadSuccess = true;
            uploadFileStub = sinon.stub(model, 'uploadFile', function (fieldName, field, options) {
                var results = {};
                results[fieldName] = isUploadSuccess ? 'success' : 'error';
                if (isUploadSuccess) {
                    options.success(results);
                } else {
                    options.error(results);
                }

            });
            successCallback = sinon.stub();
            errorCallback = sinon.stub();
            callbacks = {success:successCallback, error:errorCallback};
            triggerFieldValidationErrorStub = sinon.stub(file, '_triggerFieldValidationError');
        });

        afterEach(function () {
            uploadFileStub.restore();
            model = null;
            successCallback = null;
            errorCallback = null;
            callbacks = null;
            triggerFieldValidationErrorStub.restore();
        });

        it("should upload no files, callback with empty results", function () {
            var fields = file._getAttachmentFields(viewNoFileInputs);

            file._recursiveFileUpload(fields, model, callbacks);
            expect(uploadFileStub.callCount).toBe(0);
            expect(successCallback.callCount).toBe(1);
            expect(successCallback.args[0]).toEqual([{}]);

        });

        it("should upload one file successfully", function () {
            var fields = file._getAttachmentFields(viewOneFileInput);

            file._recursiveFileUpload(fields, model, callbacks);
            expect(uploadFileStub.callCount).toBe(1);
            expect(successCallback.callCount).toBe(1);
            expect(successCallback.args[0]).toEqual([{field1: 'success'}]);

        });

        it("should upload two files successfully", function () {
            var fields = file._getAttachmentFields(viewTwoFileInputs);

            file._recursiveFileUpload(fields, model, callbacks);
            expect(uploadFileStub.callCount).toBe(2);
            expect(successCallback.callCount).toBe(1);
            expect(successCallback.args[0]).toEqual([{field1: 'success', field2: 'success'}]);

        });

        it('should unset the model id, trigger field validation error, and call error callback', function() {
            var fields = file._getAttachmentFields(viewOneFileInput);
            isUploadSuccess = false;
            file._recursiveFileUpload(fields, model, callbacks, {deleteIfFails:true});
            expect(triggerFieldValidationErrorStub.callCount).toBe(1);
            expect(successCallback.callCount).toBe(0);
            expect(errorCallback.callCount).toBe(1);
            expect(errorCallback.args[0]).toEqual([{field1: 'error'}]);
            expect(model.has('id')).toBe(false);
        });

        it('should not unset model id if deleteIfFails is false', function() {
            var fields = file._getAttachmentFields(viewOneFileInput);
            isUploadSuccess = false;
            file._recursiveFileUpload(fields, model, callbacks, {deleteIfFails:false});
            expect(model.get('id')).toEqual('123');
        });

        it('should quit processing after the first error', function() {
            var fields = file._getAttachmentFields(viewTwoFileInputs);
            isUploadSuccess = false;
            file._recursiveFileUpload(fields, model, callbacks);
            expect(triggerFieldValidationErrorStub.callCount).toBe(1);
            expect(successCallback.callCount).toBe(0);
            expect(errorCallback.callCount).toBe(1);
            expect(errorCallback.args[0]).toEqual([{field1: 'error'}]);
        });
    });

    describe("getAttachmentFields", function () {
        it("should return no fields if none on the view", function () {
            var fields = file._getAttachmentFields(viewNoFileInputs);
            expect(fields.length).toBe(0);
        });

        it("should return no fields if no fields with a name attribute on the view", function () {
            var view = new Backbone.View();
            view.$el = $('<div><input type="file" data-mockval="C:\\fakepath\\foo.txt"/></div>');
            var fields = file._getAttachmentFields(view);
            expect(fields.length).toBe(0);
        });

        it("should return no fields if no fields with a value on the view", function () {
            var view = new Backbone.View();
            view.$el = $('<div><input type="file" name="field1"/></div>');
            var fields = file._getAttachmentFields(view);
            expect(fields.length).toBe(0);
        });

        it("should return one field if one field with a value on the view", function () {
            var view = new Backbone.View();
            view.$el = $('<div><input type="file" name="field1"/><input type="file" name="field2" data-mockval="C:\\fakepath\\foo.txt"/></div>');
            var fields = file._getAttachmentFields(view);
            expect(fields.length).toBe(1);
        });
    });
});

