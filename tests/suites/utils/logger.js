describe("Logger", function() {

    var clock,
        logger = SUGAR.App.logger,
        config = SUGAR.App.config;

    beforeEach(function() {
        config.logFormatter = 'SimpleFormatter';
        config.logWriter = 'ConsoleWriter';
    });

    afterEach(function() {
        if (clock) clock.restore();
    });

    it("should be able to log a message", function() {
        var mock = sinon.mock(console),
            date = new Date(Date.UTC(2012, 2, 3, 6, 15, 32));
        clock = sinon.useFakeTimers(date.getTime());

        config.logLevel = 'ERROR';

        mock.expects("error").once().withArgs("ERROR[2012-3-3 6:15:32]: Test message");
        logger.error("Test message");
        mock.verify();
    });

    it("should be able to log a closure", function() {
        var mock = sinon.mock(console),
            e = mock.expects("log").once(), a;

        config.logLevel = 'INFO';
        a = "foo";
        logger.info(function() {
            return "Test message " + a;
        });

        expect(e.args[0]).toMatch(/INFO\[.{14,20}\]: Test message foo/);
        mock.verify();
    });

    it("should be able to log an object", function() {
        var mock = sinon.mock(console),
            e = mock.expects("log").once(),
            foo = { bar: "some bar"};

        config.logLevel = 'TRACE';
        logger.trace(foo);
        expect(e.args[0]).toMatch(/TRACE\[.{14,20}\]: \{"bar":"some bar"\}/);
        mock.verify();
    });

    it("should not log a message if log level is below the configured one", function() {
        var mock = sinon.mock(console);
        mock.expects("log").never();
        config.logLevel = 'INFO';
        logger.debug("");
        mock.verify();
    });

    it("should be able to log a message with a given log level", function() {
        config.logLevel = 'TRACE';

        var mock = sinon.mock(logger);

        // TODO: Perhaps it should be split up into separate specs

        mock.expects("trace").once();
        mock.expects("debug").once();
        mock.expects("info").once();
        mock.expects("warn").once();
        mock.expects("error").once();
        mock.expects("fatal").once();

        logger.trace("");
        logger.debug("");
        logger.info("");
        logger.warn("");
        logger.error("");
        logger.fatal("");

        mock.verify();
    });

});
