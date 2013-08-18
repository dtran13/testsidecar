describe("alert", function() {
    var app, alert;

    beforeEach(function() {
        app = SugarTest.app;
    });

    afterEach(function() {
        app.alert.dismissAll();
    });

    it("should render alert view", function() {
        var renderStub = sinon.stub(app.view.AlertView.prototype, "render", function(options) {
            return this;
        });
        var dismissStub = sinon.stub(app.alert, "dismiss", function() {
            SugarTest.setWaitFlag();
        });

        app.alert.show("fubar", {level:'info', title:'foo', messages:"message", autoClose: true});

        SugarTest.wait();

        runs(function() {
            expect(app.alert.getAll()).toBeDefined();
            expect(app.alert.get("fubar")).toBeDefined();
            expect(app.alert.get("fubar").key).toEqual("fubar");
            expect(renderStub).toHaveBeenCalledWith({
                "level":"info",
                "autoClose":true,
                "title":"foo",
                "messages":["message"],
                "closeable":false
            });
            expect(dismissStub).toHaveBeenCalled();
            dismissStub.restore();
            renderStub.restore();
        });
    });

    it("should execute callback on autoclose", function() {
        var autoCloseSpy = sinon.spy(),
            dismissStub = sinon.stub(app.alert, "dismiss", function() {
                SugarTest.setWaitFlag();
            });

        app.alert.show("fubar", {level:'info', title:'foo', messages:"message", autoClose: true, onAutoClose: autoCloseSpy});

        SugarTest.wait();

        runs(function() {
            expect(autoCloseSpy).toHaveBeenCalled();
            expect(autoCloseSpy).toHaveBeenCalledWith(app.alert.get("fubar").key);
            expect(dismissStub).toHaveBeenCalled();
            dismissStub.restore();
        });
    });

    it("should dismiss alerts", function() {
        var alert,
            spy1,
            spy2,
            clearSpy = sinon.spy(window, "clearTimeout"),
            setTimeoutSpy = sinon.spy(window, "setTimeout"),
            autoCloseDelayOverride = 2000;
        app.config.alertAutoCloseDelay = 10000;
        app.alert.show("mykey", {level:'info', title:'foo', messages:"message", autoClose: true});
        app.alert.show("mykey2", {level:'info', title:'foo', messages:"message", autoClose: true, autoCloseDelay: autoCloseDelayOverride});
        app.alert.show("mykey3", {level:'info', title:'foo', messages:"message", autoClose: false});

        alert = app.alert.get('mykey');
        spy1 = sinon.spy(alert, "close");

        alert = app.alert.get('mykey2');
        spy2 = sinon.spy(alert, "close");

        app.alert.dismiss('mykey');
        app.alert.dismiss('mykey');
        app.alert.dismiss('mykey2');

        expect(spy1).toHaveBeenCalledOnce();
        expect(spy2).toHaveBeenCalledOnce();
        expect(app.alert.get("fubar")).toBeUndefined();
        expect(clearSpy).toHaveBeenCalledTwice();
        expect(setTimeoutSpy.firstCall.args[1]).toEqual(app.config.alertAutoCloseDelay);
        expect(setTimeoutSpy.lastCall.args[1]).toEqual(autoCloseDelayOverride);

        spy1.restore();
        spy2.restore();
        clearSpy.restore();
        setTimeoutSpy.restore();
    });

    it("should dismiss all with the given level", function() {
        var alert, s1, s2, s3;

        app.alert.show("mykey2", {level:'error', title:'bar', message:"message2", autoClose: false});
        app.alert.show("mykey1", {level:'info', title:'foo', message:"message1", autoClose: false});
        app.alert.show("mykey3", {level:'error', title:'axe', message:"message3", autoClose: false});

        alert = app.alert.get('mykey1');
        s1 = sinon.spy(alert, "close");

        alert = app.alert.get('mykey2');
        s2 = sinon.spy(alert, "close");

        alert = app.alert.get('mykey3');
        s3 = sinon.spy(alert, "close");

        app.alert.dismissAll("error");

        expect(s1).not.toHaveBeenCalled();
        expect(s2).toHaveBeenCalled();
        expect(s3).toHaveBeenCalled();

        expect(app.alert.get('mykey1')).toBeDefined();
        expect(app.alert.get('mykey2')).toBeUndefined();
        expect(app.alert.get('mykey3')).toBeUndefined();

    });

    it("should dismiss all", function() {
        app.alert.show("mykey2", {level:'error', title:'bar', message:"message2", autoClose: false});
        app.alert.show("mykey1", {level:'info', title:'foo', message:"message1", autoClose: false});
        app.alert.show("mykey3", {level:'error', title:'axe', message:"message3", autoClose: false});

        app.alert.dismissAll();

        expect(app.alert.get('mykey1')).toBeUndefined();
        expect(app.alert.get('mykey2')).toBeUndefined();
        expect(app.alert.get('mykey3')).toBeUndefined();

    });

    it("should apply styles when rendering", function() {
        var context = app.context.getContext();
        var alert = new app.view.AlertView({ context: context });
        alert.render({
            closeable: true,
            level: "info"
        });

        expect(alert.$el.hasClass("closeable")).toBeTruthy();
        expect(alert.$el.hasClass("alert-info")).toBeTruthy();

        alert = new app.view.AlertView({ context: context });
        alert.render({
            closeable: false,
            level: "error"
        });

        expect(alert.$el.hasClass("closeable")).toBeFalsy();
        expect(alert.$el.hasClass("alert-error")).toBeTruthy();


    });

});
