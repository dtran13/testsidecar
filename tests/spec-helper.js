
var SugarTest = {};

(function(test) {

    test.storage = {};
    test.keyValueStore = {
        set: function(key, value) {
            test.storage[key] = value;
        },
        add: function(key, value) {
            test.storage[key] += value;
        },
        get: function(key) {
            return test.storage[key];
        },
        has: function(key) {
            return test.storage[key] ? true : false;
        },
        cut: function(key) {
            delete test.storage[key];
        },
        cutAll: function() {
            test.storage = {};
        },
        getAll: function() {
            return test.storage;
        }
    };

    test.loadFile = function(path, file, ext, parseData, dataType) {
        dataType = dataType || 'text';

        var fileContent = null;

        $.ajax({
            async:    false, // must be synchronous to guarantee that a test doesn't run before the fixture is loaded
            cache:    false,
            dataType: dataType,
            url:      path + "/" + file + "." + ext,
            success:  function(data) {
                fileContent = parseData(data);
            },
            failure:  function() {
                console.log('Failed to load file: ' + file);
            }
        });

        return fileContent;
    };

    test.loadFixture = function(file, fixturePath) {
        return test.loadFile(fixturePath || "../fixtures", file, "json", function(data) { return data; }, "json");
    };

    test.componentsFixtureSrc = "../fixtures/components.js";

    // Only certain tests want seeded meta data so those suites can
    // load this in there respective beforeEach:
    // SugarTest.seedMetadata();
    test.seedMetadata = function(useJSMetadata, fixturePath) {
        var meta, labels, jssource, parts, labelsFixtureFilename;

        this.seedApp();
        SugarTest.dm = SUGAR.App.data;
        meta = (useJSMetadata) ? fixtures.metadata : SugarTest.loadFixture("metadata", fixturePath);

        // Lang strings are now retrieved in a separate GET, so we need to augment
        // our metadata fake with them here before calling setting metadata.set.
        if (!this.labelsFixture && meta.labels) {
            this.labelsFixture = SugarTest.loadFixture('labels', fixturePath);
            meta = $.extend(meta, this.labelsFixture);
        }

        SugarTest.app.metadata.set(meta, true, true);

        // Added jssource to simulate our jssource generated component
        jssource = (useJSMetadata) ? fixtures.jssource : null;
        if (jssource) {
            // Same way we do in metadata-manager upon injecting in HEAD
            SugarTest.app.metadata._declareClasses(jssource);
        }

        SugarTest.dm.reset();
        SugarTest.dm.declareModels(meta.modules);
        SugarTest.metadata = meta;
    };

    test._appInitialized = false;
    test.seedApp = function() {
        if (this._appInitialized) return;
        this.app = SUGAR.App.init({el: "body"});
        this._appInitialized = true;
    };

    test.seedFakeServer = function() {
        SugarTest.server = sinon.fakeServer.create();
    };

    test.waitFlag = false;
    test.wait = function() { waitsFor(function() { return test.waitFlag; }); };
    test.resetWaitFlag = function() { this.waitFlag = false; };
    test.setWaitFlag = function() { this.waitFlag = true; };
    test.components = [];
    test.dispose = function() {
        // TODO: app.destroy works incorrectly
        //if (this.app) this.app.destroy();
        if (this.server && this.server.restore) this.server.restore();
        if (Backbone && Backbone.history) Backbone.history.stop();
        _.each(this.components, function(c) {
            c.dispose();
        });
        this.components = [];
    };

    test.createComponent = function(type, params) {
        var c = this.app.view["create" + type](params);
        this.components.push(c);
        return c;
    };

}(SugarTest));

beforeEach(function(){
    SUGAR.App.config.logLevel = 'FATAL';
    SUGAR.App.config.env = "test";
    SUGAR.App.config.appId = "portal";
    SUGAR.App.config.maxQueryResult = 20;
    SUGAR.App.config.serverTimeout = 1;
    SUGAR.App.config.cacheMeta = false;
    SUGAR.App.config.minServerVersion = "6.6";
    SUGAR.App.config.supportedServerFlavors = null;
    SUGAR.App.config.alertsEl = "body";
    SUGAR.App.config.alertAutoCloseDelay = "0";
    SugarTest.storage = {};
    SUGAR.App.cache.store = SugarTest.keyValueStore;
    delete SUGAR.App.config.loadCss;

    SugarTest.seedApp();
    SugarTest.resetWaitFlag();

    // Prevents 'cannot call method x of undefined' errors for Backbone.history.
    // See http://tinnedfruit.com/2011/04/26/testing-backbone-apps-with-jasmine-sinon-3.html
    SUGAR.App.routing.setRoutes([{
        route: "",
        name: "index"
    }]);
});

afterEach(function() {
    SugarTest.dispose();
    SUGAR.App.view.reset();
});

/**
 * Data provider code.
 *
 * @see https://github.com/jphpsf/jasmine-data-provider
 */
function using(name, values, func) {
    for (var i = 0, count = values.length; i < count; i++) {
        if (Object.prototype.toString.call(values[i]) !== '[object Array]') {
            values[i] = [values[i]];
        }
        func.apply(this, values[i]);
        jasmine.currentEnv_.currentSpec.description += ' (with "' + name + '" using ' + values[i].join(', ') + ')';
    }
}
