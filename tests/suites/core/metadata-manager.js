describe('Metadata Manager', function() {
    var app, meta = fixtures.metadata;

    beforeEach(function() {
        app = SugarTest.app;
        SugarTest.seedMetadata(true);
        app.user.set('module_list', fixtures.metadata.module_list);
    });

    it('should get metadata hash', function() {
        expect(app.metadata.getHash()).toEqual("2q34aasdfwrasdfse");
    });

    it('should get view definitions', function() {
        expect(JSON.stringify(app.metadata.getView("Contacts"))).toBe(JSON.stringify(meta.modules.Contacts.views));
    });

    it('should get all modules', function() {
        expect(app.metadata.getModules()['Cases']).toBeDefined();
        expect(app.metadata.getModules()['BOGUS']).not.toBeDefined();
    });
    it('should extend loaded metadata with whats in local storage', function() {
        var origConfig = app.config;
        var newConfig = fixtures.metadata.config;
        app.metadata.set({config:newConfig});
        app.config = {};
        app._loadConfig();
        expect(app.config).toEqual(newConfig);
        // return config to its orignal state
        app.metadata.set({config:origConfig});
        app.config = origConfig;
    });

    it('should get config vars', function() {
        expect(app.metadata.getConfig()).toEqual(meta.config);
    });

    it('should get base currency id', function() {
        expect(app.metadata.getBaseCurrencyId()).toEqual('-99');
    });

    it('should get currencies', function() {
        expect(app.metadata.getCurrencies()).toEqual(meta.currencies);
    });

    it('should get currency', function() {
        expect(app.metadata.getCurrency('-99')).toEqual(meta.currencies['-99']);
    });

    it('should get definition for a specific view', function() {
        expect(app.metadata.getView("Contacts", "edit")).toEqual(meta.modules.Contacts.views.edit.meta);
    });

    it('should get base view definitions', function() {
        expect(app.metadata.getView("Test", "list")).toEqual(meta.views.list.meta);
    });
    it('should get layout definitions', function() {
        expect(app.metadata.getLayout("Contacts")).toEqual(meta.modules.Contacts.layouts);
    });
    it('should get full module list', function() {
        expect(app.metadata.getFullModuleList()).toEqual(meta.full_module_list);
    });
    it('should get default layout defs', function() {
        expect(app.metadata.getLayout("Test", "list")).toEqual(meta.layouts.list.meta);
    });
    it('should get a specific layout', function() {
        expect(JSON.stringify(app.metadata.getLayout("Contacts", "detail")))
            .toBe(JSON.stringify(meta.modules.Contacts.layouts.detail.meta));
    });

    it('should get a varchar sugarfield', function() {
        expect(app.metadata.getField('varchar')).toBe(meta.fields.text);
    });

    it('should get a specific sugarfield', function() {
        expect(JSON.stringify(app.metadata.getField('phone'))).toBe(JSON.stringify(meta.fields.phone));
    });

    it('should get a undefined sugarfield as text', function() {
        expect(app.metadata.getField('doesntexist')).toBe(meta.fields.text);
    });

    it('should get an array of module name', function() {
        expect(app.metadata.getModuleNames(false)).toEqual(['Accounts', 'Bugs', 'Cases', 'Contacts']);

        app.config.displayModules = ["Bugs", "Cases"];
        expect(app.metadata.getModuleNames(true)).toEqual(['Bugs', 'Cases']);

        var hasAccessStub = sinon.stub(app.acl,"hasAccess",function(access, module) {
            return !((access == 'create' && module == 'Bugs') || access == 'bad');
        });

        expect(app.metadata.getModuleNames(true,'create')).toEqual(['Cases']);
        expect(app.metadata.getModuleNames(false,'create')).toEqual(['Accounts', 'Cases', 'Contacts']);
        expect(app.metadata.getModuleNames(false,'dummy')).toEqual(['Accounts', 'Bugs', 'Cases', 'Contacts']);
        expect(app.metadata.getModuleNames(false,'bad')).toEqual([]);
        hasAccessStub.restore();
    });

    it('should get strings', function() {
        var labels = SugarTest.labelsFixture;
        expect(app.metadata.getStrings("mod_strings")).toBe(labels.mod_strings);
        expect(app.metadata.getStrings("app_strings")).toBe(labels.app_strings);
        expect(app.metadata.getStrings("app_list_strings")).toBe(labels.app_list_strings);
    });

    it('should get currencies', function() {
        expect(app.metadata.getCurrency("abc123")).toBeDefined();
        expect(app.metadata.getCurrency("abc123").iso4217).toBe("EUR");
    });

    it('should patch field displayParams metadata', function() {
        var field = app.metadata.getView("Contacts", "edit").panels[0].fields[2],
            field2 = app.metadata.getView("Contacts", "edit").panels[0].fields[4];
        expect(_.isObject(field)).toBeTruthy();
        expect(field.name).toEqual("phone_home");
        expect(field.type).toEqual("text");
        expect(field.label).toEqual("LBL_PHONE_HOME");
        expect(field.required).toBeTruthy();

        expect(_.isObject(field2)).toBeTruthy();
        expect(field2.fields).toBeTruthy();
        expect(field2.fields[0].name).toEqual("subfield 1");
    });

    it('should patch view metadata', function() {
        var field = app.metadata.getView("Contacts", "detail").panels[0].fields[3];
        expect(_.isObject(field)).toBeTruthy();
        expect(field.name).toEqual("phone_home");
        expect(field.type).toEqual("text");
    });

    describe('getHiddenSubpanels', function(){
        it('should return list of names for modules that are hidden in subpanels', function(){
            var hiddenList = app.metadata.getHiddenSubpanels();
            expect(_.size(hiddenList)).toBe(2);
            expect(hiddenList[0]).toEqual("contacts");
            expect(hiddenList[1]).toEqual("bugs");
        });
    });

    it('should allow caller to ask not to fallback when getting view', function() {
        var actual = app.metadata.getView("Contacts", "no_i_dont_think_so_buddy", true);
        expect(actual).toBeFalsy();
    });

    it("should delegate to view-manager if has a custom view controller", function() {
        sinon.spy(app.view, "declareComponent");
        // Hack - metadata.set with a different object results in mutation of fixtures.metadata
        var originalMeta = $.extend(/*deep=*/true, {}, fixtures.metadata);
        app.metadata.set({modules: { Home: fixtures.jssource.modules.Home }});//has base and portal platforms
        expect(app.view.declareComponent.getCall(0).args[0]).toEqual("view");
        expect(app.view.declareComponent.getCall(0).args[1]).toEqual("login");
        expect(app.view.declareComponent.getCall(0).args[2]).toEqual("Home");
        expect(app.view.declareComponent.getCall(0).args[3].customCallback()).toEqual("base called");
        expect(typeof(app.view.declareComponent.getCall(0).args[3].customCallback)).toBe("function");
        expect(app.view.declareComponent.getCall(1).args[0]).toEqual("view");
        expect(app.view.declareComponent.getCall(1).args[1]).toEqual("login");
        expect(app.view.declareComponent.getCall(1).args[2]).toEqual("Home");
        expect(app.view.declareComponent.getCall(1).args[3].customCallback()).toEqual("overriden portal");
        expect(app.view.views.BaseHomeLoginView).toBeDefined();
        expect(app.view.views.BaseHomeLoginView).toBeDefined();
        expect(app.view.views.PortalHomeLoginView.prototype.customCallback).toBeDefined();
        expect(app.view.views.PortalHomeLoginView.prototype.customCallback).toBeDefined();
        app.view.declareComponent.restore();
        fixtures.metadata = originalMeta;
    });

    it("should delegate to view-manager if has custom layout controller", function() {
        sinon.spy(app.view, "declareComponent");
        // Hack - metadata.set with a different object results in mutation of fixtures.metadata
        var originalMeta = $.extend(/*deep=*/true, {}, fixtures.metadata);
        app.metadata.set({modules: { Contacts: fixtures.jssource.modules.Contacts}});
        expect(app.view.declareComponent.getCall(0).args[0]).toEqual("layout");
        expect(app.view.declareComponent.getCall(0).args[1]).toEqual("detailplus");
        expect(app.view.declareComponent.getCall(0).args[2]).toEqual("Contacts");
        expect(typeof(app.view.declareComponent.getCall(0).args[3].customLayoutCallback)).toBe("function");
        expect(app.view.layouts.BaseContactsDetailplusLayout).toBeDefined();
        expect(app.view.layouts.BaseContactsDetailplusLayout.prototype.customLayoutCallback).toBeDefined();
        app.view.declareComponent.restore();
        fixtures.metadata = originalMeta;
    });

    it("should delegate to template.compile if meta set with custom view template", function() {
        sinon.spy(app.template, "setView");
        sinon.spy(app.template, "setLayout");
        app.metadata.set({
            modules: {
                Taxonomy: {
                    views: {
                        tree: {
                            templates: {
                                'tree': "My Lil Template",
                                'view2': "My Lil Template2" // can now have multiple templates per single view
                            }
                        }
                    },
                    layouts: {
                        oak: {
                            templates: {
                                'oak': "My happy Template",
                                'view2': "My happy Template2" // can now have multiple templates per single layout
                            }
                        }
                    }
                }
            }
        });
        expect(app.template.setView.getCall(0).args[0]).toEqual("tree");
        expect(app.template.setView.getCall(0).args[1]).toEqual("Taxonomy");
        expect(app.template.setView.getCall(0).args[2]).toEqual('My Lil Template');
        expect(app.template.setView.getCall(1).args[0]).toEqual("tree.view2");
        expect(app.template.setView.getCall(1).args[1]).toEqual("Taxonomy");
        expect(app.template.setView.getCall(1).args[2]).toEqual('My Lil Template2');

        expect(app.template.setLayout.getCall(0).args[0]).toEqual("oak");
        expect(app.template.setLayout.getCall(0).args[1]).toEqual("Taxonomy");
        expect(app.template.setLayout.getCall(0).args[2]).toEqual('My happy Template');
        expect(app.template.setLayout.getCall(1).args[0]).toEqual("oak.view2");
        expect(app.template.setLayout.getCall(1).args[1]).toEqual("Taxonomy");
        expect(app.template.setLayout.getCall(1).args[2]).toEqual('My happy Template2');
        expect(Handlebars.templates["tree.Taxonomy"]).toBeDefined();
        app.template.setView.restore();
        app.template.setLayout.restore();
    });

    it("should delegate to template.compile if meta set with custom field templates", function() {
        sinon.spy(app.template, "setField");
        app.metadata.set({
            modules: {
                Taxonomy: {
                    fieldTemplates: {
                        tree: {
                            templates: {
                                "default": "My Lil Template"
                            }
                        }
                    }
                }
            }
        });
        expect(app.template.setField.getCall(0).args[0]).toEqual("tree");
        expect(app.template.setField.getCall(0).args[1]).toEqual("default");
        expect(app.template.setField.getCall(0).args[2]).toEqual("Taxonomy");
        expect(app.template.setField.getCall(0).args[3]).toEqual('My Lil Template');
        expect(Handlebars.templates["f.tree.Taxonomy.default"]).toBeDefined();
        app.template.setField.restore();
    });

    it("should register view controllers without metadata", function () {
        sinon.spy(app.view, "declareComponent");
        app.metadata.set({
            modules:{
                Taxonomy:{
                    views:{
                        base: {
                            tree:{
                                controller:"({})"
                            }
                        }
                    }
                }
            }
        });
        expect(app.view.declareComponent.getCall(0).args[1]).toEqual("tree");
        expect(app.view.views.BaseTaxonomyTreeView).toBeDefined();
        app.view.declareComponent.restore();
    });

    it("should call setLayout when a layout has a template", function () {
        sinon.spy(app.template, "setLayout");
        // for meta.modules, we don't have a <platform> like 'base'
        app.metadata.set({
            modules:{
                Taxonomy:{
                    layouts:{
                        tree:{
                            controller:"({})",
                            templates: {
                                "tree": "Custom Layout Template"
                            }
                        }
                    }
                }
            }
        });
        expect(app.template.setLayout.getCall(0).args[0]).toEqual("tree");
        expect(app.template.setLayout.getCall(0).args[1]).toEqual("Taxonomy");
        expect(app.template.setLayout.getCall(0).args[2]).toEqual("Custom Layout Template");
        expect(Handlebars.templates['l.Taxonomy.tree']).toBeDefined();
        app.template.setLayout.restore();
    });

    describe('when syncing metadata', function() {
        beforeEach(function() {
            app.cache.cutAll(true);
            SugarTest.seedFakeServer();
        });

        it('should sync metadata and extend whatever is in memory cache', function() {
            // Set some initial metadata
            app.metadata.set({
                _hash: "xyz",
                modules: { ENTRY: "x" },
                relationships: { ENTRY: "x" },
                fields: { ENTRY: "x"},
                views: { ENTRY: "x"},
                layouts: { ENTRY: "x"},
                module_list: { ENTRY: "x" }
            }, true, true);

            SugarTest.server.respondWith("GET", /.*\/rest\/v10\/metadata\?type_filter=&module_filter=.*/,
                [200, {"Content-Type": "application/json"}, JSON.stringify(meta)]);

            // Fake response for _fetchLabels's ajax call, since meta.labels is just a URL to a JSON file
            SugarTest.server.respondWith("GET", /.*\/fixtures\/labels.json.*/,
                [200, {"Content-Type": "application/json"}, JSON.stringify(SugarTest.labelsFixture)]);

            app.metadata.sync();
            SugarTest.server.respond();

            var newMeta = app.metadata._dev_data;
            _.each(["modules",
                    "relationships",
                    "fields",
                    "views",
                    "layouts",
                    "module_list"
            ],
                function(prop) {
                    // Check the new meta has been updated
                    checkMeta(newMeta, meta, prop);
                    // Check that old meta is still there
                    expect(newMeta[prop].ENTRY).toBeDefined();
                });

            expect(app.config.configfoo).toEqual("configBar");
        });

        function checkMeta(newMeta, oldMeta, prop) {
            _.each(_.keys(oldMeta[prop]), function(key) {
                expect(newMeta[prop][key]).toEqual(oldMeta[prop][key]);
            });
        }

        it('should cache metadata if requested', function() {
            // Verify hash doesn't exist
            expect(SugarTest.storage["test:portal:meta:hash"]).toBeUndefined();

            app.config.cacheMeta = true;
            meta.config.cacheMeta = true;
            app.metadata.reset();

            SugarTest.server.respondWith("GET", /.*\/rest\/v10\/metadata\?type_filter=&module_filter=.*/,
                [200, {"Content-Type": "application/json"}, JSON.stringify(meta)]);

            // Fake response for _fetchLabels's ajax call, since meta.labels is just a URL to a JSON file
            SugarTest.server.respondWith("GET", /.*\/fixtures\/labels.json.*/,
                [200, {"Content-Type": "application/json"}, JSON.stringify(SugarTest.labelsFixture)]);

            app.metadata.sync();
            SugarTest.server.respond();

            _.each(meta, function(bucket, name) {
                if (name !== "_hash" && name !=="labels") {
                    expect(SugarTest.storage["test:portal:meta:data"][name]).toEqual(bucket);
                }
            });
            expect(SugarTest.storage["test:portal:meta:hash"]).toEqual("2q34aasdfwrasdfse");
            expect(SugarTest.storage["test:portal:meta:data"]["_hash"]).toEqual("2q34aasdfwrasdfse");

            app.metadata.clearCache();
            expect(SugarTest.storage["test:portal:meta:data"]).toBeUndefined();
            expect(SugarTest.storage["test:portal:meta:hash"]).toBeUndefined();
        });

        it('should handle mime settings that are misconfigured thus returning text/plain for .json file', function() {
            app.config.cacheMeta = true;
            meta.config.cacheMeta = true;
            app.metadata.reset();
            SugarTest.server.respondWith("GET", /.*\/rest\/v10\/metadata\?type_filter=&module_filter=.*/,
                [200, {"Content-Type": "application/json"}, JSON.stringify(meta)]);
            // Fake response for _fetchLabels's ajax call, since meta.labels is just a URL to a JSON file
            SugarTest.server.respondWith("GET", /.*\/fixtures\/labels.json.*/,
                [200, {"Content-Type": "text/plain"}, '{"omg": "it works!"}']);
            app.metadata.sync();
            SugarTest.server.respond();
            expect(app.metadata.getStrings('omg')).toEqual("it works!");
            app.metadata.clearCache();
        });

        it('should handle invalid JSON after fetching labels data', function() {
             app.config.cacheMeta = true;
             meta.config.cacheMeta = true;
             app.metadata.reset();
             var stub = sinon.stub();
             SugarTest.server.respondWith("GET", /.*\/rest\/v10\/metadata\?type_filter=&module_filter=.*/,
                 [200, {"Content-Type": "application/json"}, JSON.stringify(meta)]);
             // Fake response for _fetchLabels's ajax call, since meta.labels is just a URL to a JSON file
             SugarTest.server.respondWith("GET", /.*\/fixtures\/labels.json.*/,
                 [200, {"Content-Type": "text/plain"}, 'invalid json']);
             app.metadata.sync(stub);
             SugarTest.server.respond();

             expect(stub).toHaveBeenCalledWith({
                 code: "sync_failed",
                 label: "ERR_SYNC_FAILED"
             });
             app.metadata.clearCache();
         });

        it('should not take any action when server returns 304', function() {
            var spy = sinon.spy(app.metadata, "set");

            SugarTest.server.respondWith("GET", /.*\/rest\/v10\/metadata\?type_filter=&module_filter=.*/,
                [304, {"Content-Type": "application/json"}, ""]);

            // Fake response for _fetchLabels's ajax call, since meta.labels is just a URL to a JSON file
            SugarTest.server.respondWith("GET", /.*\/fixtures\/labels.json.*/,
                [200, {"Content-Type": "application/json"}, JSON.stringify(SugarTest.labelsFixture)]);

            app.metadata.sync();
            SugarTest.server.respond();

            expect(spy).not.toHaveBeenCalled();
            spy.restore();

        });

        it("should fetch only requested types", function() {
            var getMetadataStub;
            app.metadata.reset();

            getMetadataStub = sinon.stub(app.api,"getMetadata");

            app.metadata.sync(null, {metadataTypes: ['labels']});

            expect(getMetadataStub).toHaveBeenCalled();
            expect(getMetadataStub.args[0][1]).toEqual(['labels']);

            getMetadataStub.restore();
        });

        it("should use the default language if app.lang not yet set", function() {
            var metaJson, expectedUrl, getMetadataStub, getLanguageStub, ajaxStub;
            ajaxStub = sinon.stub(jQuery, "ajax"); // prevent proxying to real ajax!
            app.metadata.reset();
            // SugarTest.seedMetadata(true);

            expectedUrl = app.utils.buildUrl(meta.labels.en_us);
            metaJson = {
                jssource: null,
                labels: meta.labels,
                "server_info": {
                    "version":"6.6.0"
                }
            };
            getMetadataStub = sinon.stub(app.api,"getMetadata", function(hash, types, modules, callbacks, options) {
                // Force production code's success hook to fire passing our fake meta
                callbacks.success(metaJson);
            });
            getLanguageStub = sinon.stub(app.user, "getLanguage", function() {
                return undefined; // simulate user lang not yet set
            });

            app.lang.currentLanguage = undefined;
            app.metadata.sync();
            SugarTest.server.respond();

            // Expectation: SUT will use 'default' property when app.lang doesn't yet have language set
            expect(ajaxStub).toHaveBeenCalled();
            expect(ajaxStub.args[0][0].url).toEqual(expectedUrl);

            SugarTest.server.restore();
            ajaxStub.restore();
            getMetadataStub.restore();
            expect(app.lang.currentLanguage).toEqual('en_us');
            getLanguageStub.restore();
        });

        it("should write language strings to metadata and cache", function() {
            app.metadata.reset();

            SugarTest.server.respondWith("GET", /.*\/rest\/v10\/metadata\?type_filter=&module_filter=.*/,
                [200, {"Content-Type": "application/json"}, JSON.stringify(meta)]);

            // Fake response for _fetchLabels's ajax call, since meta.labels is just a URL to a JSON file
            SugarTest.server.respondWith("GET", /.*\/fixtures\/labels.json.*/,
                [200, {"Content-Type": "application/json"}, JSON.stringify(SugarTest.labelsFixture)]);

            app.metadata.sync();
            SugarTest.server.respond();

            expect(app.metadata.getStrings('app_strings')._hash).toEqual('x5');
            expect(app.metadata.getStrings('app_list_strings')._hash).toEqual('x4');

            SugarTest.server.restore();
        });
        it("should include a jssource file if one is returned", function() {
            var scripts, lastScript, compFixtureSrc;
            compFixtureSrc = SugarTest.componentsFixtureSrc;
            sinon.spy(app.metadata, "_declareClasses");
            app.config.cacheMeta = true;
            meta.config.cacheMeta = true;
            app.metadata.reset();

            SugarTest.server.respondWith("GET", /.*\/rest\/v10\/metadata\?type_filter=&module_filter=.*/,
                [200, {"Content-Type":"application/json"}, JSON.stringify({
                    "jssource" : compFixtureSrc,
                    labels: meta.labels,
                    "server_info": {
                        "version":"6.6.0"
                    }
            })]);

            // Fake response for _fetchLabels's ajax call, since meta.labels is just a URL to a JSON file
            SugarTest.server.respondWith("GET", /.*\/fixtures\/labels.json.*/,
                [200, {"Content-Type": "application/json"}, JSON.stringify(SugarTest.labelsFixture)]);

            app.metadata.sync();
            SugarTest.server.respond();

            //Verify the element was added to the head.
            scripts    = $("head script");
            lastScript = scripts[scripts.length-1];
            expect($(lastScript).attr('src')).toEqual(app.utils.buildUrl(compFixtureSrc));

            SugarTest.server.restore();
            //To override timing, force include and eval the fixture file.
            $.ajax({
                url : compFixtureSrc,
                async : false,
                dataType : "script",
                success : function(){
                    //Fire do when to trigger the metadata-managers callback
                    app.utils._doWhenCheck();
                },
                error: function(xhr, e) {
                    // I found useful when debugging why this wasn't working in jstestdriver so leaving in ;=)
                    console.log("ERRROR: " + e);
                }
            });

            expect(app.metadata._declareClasses.getCall(1).args[0]).toEqual(SUGAR.jssource);
            app.metadata._declareClasses.restore();
        });

        it("should declare classes by platform", function() {
            var compFixture = SUGAR.jssource,
                spy = sinon.spy(app.metadata, "_sortAndDeclareComponents"),
                stub = sinon.stub(app.view, 'declareComponent');

            // _declareClasses should loop fields, views, layouts, each by platform
            app.metadata._declareClasses(compFixture);
            _(6).times(function(n) {
                // Base platform
                if (n % 2 === 0) {
                    expect(spy.getCall(n).args[3]).toEqual('base');
                    expect(spy.getCall(n).args[0].a.controller.baseA).toEqual(true);
                    expect(stub.getCall(n).args[5]).toEqual('base');
                    expect(stub.getCall(n).args[3].baseA).toEqual(true);
                } else {
                    // Portal platform
                    expect(spy.getCall(1).args[3]).toEqual('portal');
                    expect(spy.getCall(1).args[0].a.controller.portalA).toEqual(true);
                    expect(stub.getCall(1).args[5]).toEqual('portal');
                    expect(stub.getCall(1).args[3].portalA).toEqual(true);
                }
            });
            spy.restore();
            stub.restore();
        });

        it("sorts controllers by inheretence", function() {
            var views = {
                leaf : {
                    controller : {
                        extendsFrom : "MiddleView",
                        test : "leaf"
                    }
                },
                middle : {
                    controller : {
                        extendsFrom : "Zz_baseView",
                        test : "middle"
                    }
                },
                middle2 : {
                    controller : {
                        extendsFrom : "Zz_baseView",
                        test : "middle2"
                    }
                },
                zz_base : {
                    meta : {},
                    controller : {
                        test : "zz_base"
                    }
                }
            };
            var sortedViews = app.metadata._sortControllers("view", views);
            expect(sortedViews[0].type).toBe("zz_base");
            expect(sortedViews[0].weight).toBe(-3);
            expect(sortedViews[1].type).toBe("middle");
            expect(sortedViews[1].weight).toBe(-1);
        });

        it("sorts module controllers by inheretence", function () {
            var layouts = {
                middle2:{
                    controller:{
                        extendsFrom:"FooZz_baseLayout",
                        test:"middle2"
                    }
                },
                middle:{
                    controller:{
                        extendsFrom:"FooZz_baseLayout",
                        test:"middle"
                    }
                },
                zz_base:{
                    meta:{},
                    controller:{
                        test:"zz_base"
                    }
                },
                leaf:{
                    controller:{
                        extendsFrom:"FooMiddleLayout",
                        test:"leaf"
                    }
                }
            };
            var sortedLayouts = app.metadata._sortControllers("layout", layouts, "Foo");
            expect(sortedLayouts[0].type).toBe("zz_base");
            expect(sortedLayouts[0].weight).toBe(-3);
            expect(sortedLayouts[1].type).toBe("middle");
            expect(sortedLayouts[1].weight).toBe(-1);
        });

        it("Starts app sync when the local storage metadata hash changes", function () {
            //Clear an existing interval on the real window object if it exists
            if (app.metadata._validateMDInterval)
                window.clearInterval(app.metadata._validateMDInterval);

            var syncMock = sinon.stub(app, "sync"),
                //Set the metadata Api to just call its callback argument (index 3) and set the hash
                mdApiCallStub = sinon.stub(app.api, "getMetadata", function(a, b, c, d){
                    if (_.isObject(d) && _.isFunction(d.success))
                    {
                        d.success({_hash:"bar"});
                    }
                }),
                compatSub = sinon.stub(app, "isServerCompatible").returns(true),
                clock = sinon.useFakeTimers(),
                hash = app.metadata.getHash(),
                cacheStub = sinon.stub(app.cache, "get");

            //Trigger a sync to ensure hash is set as we want and internal variables are set properly.
            app.metadata.sync();

            //Call to init should create the interval we are looking for
            app.metadata.init();

            expect(hash).toBeDefined();
            expect(hash).not.toBe("");

            //Set the cache to return a different hash
            cacheStub.withArgs("meta:hash").returns("foo");

            //First tick should trigger the 100ms interval and 500ms wait
            clock.tick(600);

            expect(app.metadata.isSyncing()).toBeTruthy();
            expect(syncMock).toHaveBeenCalled();

            app.metadata.sync();
            expect(app.metadata.isSyncing()).toBeFalsy();

            syncMock.restore();
            mdApiCallStub.restore();
            compatSub.restore();
            cacheStub.restore();
            clock.restore();
        });
        it("should determine if metadata types are separated by platform", function() {
            var actual,
                metaIsSeparatedByPlatform = {
                    fields: {
                        base: {
                            foo: {controller: {}}
                        },
                        portal: {
                            bar: { controller: {}}
                        }
                    }
                },
                //most closely replicates SP-757 bug where modules/Contacts/clients/portal/views/record.js not loaded
                metaIsSeparatedByPlatformNoBasePlatform = {
                    views: {
                        portal: {
                            bar: { controller: {}}
                        }
                    }
                },
                metaNotSeparatedByPlatform = {
                    fields: {
                        // Note that 'base' here is actually the name of field e.g. app.view.fields.base
                        base: {
                            controller: {}
                        }
                    }
                };
            actual = app.metadata._metaTypeIsSeparatedByPlatform(metaIsSeparatedByPlatform, 'field', ['base','portal']);
            expect(actual).toBeTruthy();
            actual = app.metadata._metaTypeIsSeparatedByPlatform(metaNotSeparatedByPlatform, 'field', ['base','portal']);
            expect(actual).toBeFalsy();
            actual = app.metadata._metaTypeIsSeparatedByPlatform(metaIsSeparatedByPlatformNoBasePlatform, 'view', ['base','portal']);
            expect(actual).toBeTruthy();
        });

        it("should declare module field components when field component is specified in the module metadata", function() {
            var oldPlatform = app.config.platform;
                spy = sinon.spy(app.metadata, "_sortAndDeclareComponents"),
                stub = sinon.stub(app.view, 'declareComponent'),
                moduleFieldsMetadata = {
                    modules: {
                        Contacts: {
                            fieldTemplates: {
                                base: {
                                    myfield: {
                                        controller: {},
                                        templates: {}
                                    }
                                }
                            }
                        }
                    }
                };

            app.config.platform = 'base';
            app.metadata._declareClasses(moduleFieldsMetadata);

            expect(spy.calledOnce).toBe(true);
            expect(spy.withArgs(moduleFieldsMetadata.modules.Contacts.fieldTemplates.base, 'field', 'Contacts', 'base').calledOnce).toBe(true);

            app.config.platform = oldPlatform;
            spy.restore();
            stub.restore();
        });
    });
});
