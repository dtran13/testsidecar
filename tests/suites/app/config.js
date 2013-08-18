describe("Application configuration", function() {

    it("should have all properties defined", function() {
        var config = SUGAR.App.config;

        expect(config.appId).toBeDefined();
        expect(config.env).toBeDefined();
        expect(config.logLevel).toBeDefined();
        expect(config.logFormatter).toBeDefined();
        expect(config.logWriter).toBeDefined();
        expect(config.platform).toBeDefined();
        expect(config.maxQueryResult).toBeDefined();
        expect(config.serverUrl).toBeDefined();
        expect(config.debugSugarApi).toBeDefined();
        expect(config.metadataTypes).toBeDefined();
        expect(config.unsecureRoutes).toBeDefined();
    });

});
