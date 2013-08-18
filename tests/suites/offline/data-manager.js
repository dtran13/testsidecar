
// TODO: More tests needed: oldId, errors

describe("DataManager.sync", function() {

    var app = SUGAR.App, origStorageAdapter, spySa, 
        origSync, callback, options, sa;

    callback = function() { SugarTest.setWaitFlag(); };
    options = {
        silent: true,
        skipRemoteSync: true,
        success: callback,
        error: callback
    };

    // StorageAdapter stub
    sa = {
        sync: function(method, model, options) {
            _.delay(options.success, 20);
        }
    };

    beforeEach(function() {
        origStorageAdapter = app.Offline.storageAdapter;
        origSync = Backbone.sync;
        Backbone.sync = app.Offline.dataManager.sync;
        app.Offline.storageAdapter = sa;
        spySa = sinon.spy(sa, "sync");
        options.synced = false;
    });

    afterEach(function() {
        app.Offline.storageAdapter = origStorageAdapter;
        Backbone.sync = origSync;
        if (sa.sync.restore) sa.sync.restore();
    });

    describe("skipRemoteSync=true", function() {

        beforeEach(function() {
            options.skipRemoteSync = true;
        });

        it("should be able to create a bean", function() {
            var bean = new app.Offline.Bean();
            bean.save(null, options);

            SugarTest.wait();

            runs(function() {
                expect(bean.syncState).toEqual(app.Offline.dataManager.SYNC_STATES.CREATE);
                expect(bean.modifiedAt).not.toBeNull();
                expect(spySa.withArgs("create", bean)).toBeTruthy();
            });
        });

        it("should be able to update a bean", function() {
            var bean = new app.Offline.Bean({id: "foo"});
            bean.save(null, options);

            SugarTest.wait();

            runs(function() {
                expect(bean.syncState).toEqual(app.Offline.dataManager.SYNC_STATES.UPDATE);
                expect(bean.modifiedAt).not.toBeNull();
                expect(spySa.firstCall.calledWith("update", bean)).toBeTruthy();
            });
        });

        it("should be able to update a previously created non-synced bean", function() {
            var bean = new app.Offline.Bean({id: "foo"});
            bean.syncState = app.Offline.dataManager.SYNC_STATES.CREATE;
            bean.modifiedAt = 1234;
            bean.save(null, options);

            SugarTest.wait();

            runs(function() {
                expect(bean.syncState).toEqual(app.Offline.dataManager.SYNC_STATES.CREATE);
                expect(bean.modifiedAt).toEqual(1234);
                expect(spySa.firstCall.calledWith("update", bean)).toBeTruthy();
            });
        });

        it("should be able to update a previously updated non-synced bean", function() {
            var bean = new app.Offline.Bean({id: "foo"});
            bean.syncState = app.Offline.dataManager.SYNC_STATES.UPDATE;
            bean.modifiedAt = 1234;
            bean.save(null, options);

            SugarTest.wait();

            runs(function() {
                expect(bean.syncState).toEqual(app.Offline.dataManager.SYNC_STATES.UPDATE);
                expect(bean.modifiedAt).toBeGreaterThan(1234);
                expect(spySa.firstCall.calledWith("update", bean)).toBeTruthy();
            });
        });

        it("should be able to soft-delete a bean", function() {
            var bean = new app.Offline.Bean({id: "foo"});
            bean.destroy(options);

            SugarTest.wait();

            runs(function() {
                expect(bean.syncState).toEqual(app.Offline.dataManager.SYNC_STATES.DELETE);
                expect(bean.modifiedAt).not.toBeNull();
                expect(spySa.firstCall.calledWith("update", bean)).toBeTruthy();
            });
        });

        it("should be able to hard-delete a previously created non-synced bean", function() {
            var bean = new app.Offline.Bean({id: "foo"});
            bean.syncState = app.Offline.dataManager.SYNC_STATES.CREATE;
            bean.modifiedAt = 1234;
            bean.destroy(options);

            SugarTest.wait();

            runs(function() {
                expect(spySa.firstCall.calledWith("delete", bean)).toBeTruthy();
            });
        });

        it("should be able to fetch a bean", function() {
            var bean = new app.Offline.Bean({id: "foo"});
            bean.fetch(options);

            SugarTest.wait();

            runs(function() {
                expect(spySa.firstCall.calledWith("read", bean)).toBeTruthy();
            });
        });

        it("should be able to fetch beans", function() {
            var beans = new app.BeanCollection();
            beans.fetch(options);

            SugarTest.wait();

            runs(function() {
                expect(spySa.firstCall.calledWith("read", beans)).toBeTruthy();
            });
        });

    });

    describe("skipRemoteSync=false", function() {

        var origDataManager,
            spyDm, dm;

        // DataManager stub
        dm = {
            sync: function(method, model, options) {
                app.logger.trace('remote-sync-' + method + ": " + model);
                _.delay(options.success, 20);
            }
        };

        beforeEach(function() {
            options.skipRemoteSync = false;
            origDataManager = app.dataManager;
            app.dataManager = dm;
            spyDm = sinon.spy(dm, "sync");
        });

        afterEach(function() {
            if (dm.sync.restore) dm.sync.restore();
            app.dataManager = origDataManager;
        });

        it("should be able to create a bean", function() {
            var bean = new app.Offline.Bean();
            bean.save(null, options);

            SugarTest.wait();

            runs(function() {
                expect(bean.syncState).toBeNull();
                expect(bean.modifiedAt).toBeNull();
                expect(spySa.firstCall.calledWith("create", bean)).toBeTruthy();
                expect(spySa.secondCall.calledWith("update", bean)).toBeTruthy();
                expect(spyDm.firstCall.calledWith("create", bean)).toBeTruthy();
            });
        });

        it("should be able to update a bean", function() {
            var bean = new app.Offline.Bean({id: "foo"});
            bean.save(null, options);

            SugarTest.wait();

            runs(function() {
                expect(bean.syncState).toBeNull();
                expect(bean.modifiedAt).toBeNull();
                expect(spySa.firstCall.calledWith("update", bean)).toBeTruthy();
                expect(spySa.secondCall.calledWith("update", bean)).toBeTruthy();
                expect(spyDm.firstCall.calledWith("update", bean)).toBeTruthy();
            });
        });

        it("should be able to update a previously created non-synced bean", function() {
            var bean = new app.Offline.Bean({id: "foo"});
            bean.syncState = app.Offline.dataManager.SYNC_STATES.CREATE;
            bean.modifiedAt = 1234;
            bean.save(null, options);

            SugarTest.wait();

            runs(function() {
                expect(bean.syncState).toBeNull();
                expect(bean.modifiedAt).toBeNull();
                expect(spySa.firstCall.calledWith("update", bean)).toBeTruthy();
                expect(spySa.secondCall.calledWith("update", bean)).toBeTruthy();
                expect(spyDm.firstCall.calledWith("create", bean)).toBeTruthy();
            });
        });

        it("should be able to update a previously updated non-synced bean", function() {
            var bean = new app.Offline.Bean({id: "foo"});
            bean.syncState = app.Offline.dataManager.SYNC_STATES.UPDATE;
            bean.modifiedAt = 1234;
            bean.save(null, options);

            SugarTest.wait();

            runs(function() {
                expect(bean.syncState).toBeNull();
                expect(bean.modifiedAt).toBeNull();
                expect(spySa.firstCall.calledWith("update", bean)).toBeTruthy();
                expect(spySa.secondCall.calledWith("update", bean)).toBeTruthy();
                expect(spyDm.firstCall.calledWith("update", bean)).toBeTruthy();
            });
        });

        it("should be able to hard-delete a bean", function() {
            var bean = new app.Offline.Bean({id: "foo"});
            bean.destroy(options);

            SugarTest.wait();

            runs(function() {
                expect(bean.syncState).toBeNull();
                expect(bean.modifiedAt).toBeNull();
                expect(spySa.firstCall.calledWith("update", bean)).toBeTruthy();
                expect(spySa.secondCall.calledWith("delete", bean)).toBeTruthy();
                expect(spyDm.firstCall.calledWith("delete", bean)).toBeTruthy();
            });
        });

        it("should be able to hard-delete a previously created non-synced bean", function() {
            var bean = new app.Offline.Bean({id: "foo"});
            bean.syncState = app.Offline.dataManager.SYNC_STATES.CREATE;
            bean.modifiedAt = 1234;
            bean.destroy(options);

            SugarTest.wait();

            runs(function() {
                expect(spySa.firstCall.calledWith("delete", bean)).toBeTruthy();
                expect(spyDm.callCount).toEqual(0);
            });
        });

        it("should be able to fetch a bean", function() {
            var bean = new app.Offline.Bean({id: "foo"});
            bean.fetch(options);

            SugarTest.wait();

            runs(function() {
                expect(spySa.firstCall.calledWith("read", bean)).toBeTruthy();
                expect(spySa.secondCall.calledWith("update", bean)).toBeTruthy();
                expect(spyDm.firstCall.calledWith("read", bean)).toBeTruthy();
            });
        });

        it("should be able to fetch beans", function() {
            var beans = new app.BeanCollection(),
                opts = _.clone(options);
            opts.skipOffline = true;

            beans.fetch(opts);

            SugarTest.wait();

            runs(function() {
                expect(spySa.callCount).toEqual(0);
                expect(spyDm.firstCall.calledWith("read", beans)).toBeTruthy();
            });
        });


        describe("options.synced=true", function() {

            beforeEach(function() {
                options.synced = true;
            });

            it("should be able to reset sync state of a bean in CREATED state", function() {
                var bean = new app.Offline.Bean({id: "foo"});
                bean.syncState = app.Offline.dataManager.SYNC_STATES.CREATE;
                bean.modifiedAt = 1234;
                bean.save(null, options);

                SugarTest.wait();

                runs(function() {
                    expect(bean.syncState).toBeNull();
                    expect(bean.modifiedAt).toBeNull();
                    expect(spySa.firstCall.calledWith("update", bean)).toBeTruthy();
                    expect(spyDm.callCount).toEqual(0);
                });
            });

            it("should be able to reset sync state of a bean in UPDATED state", function() {
                var bean = new app.Offline.Bean({id: "foo"});
                bean.syncState = app.Offline.dataManager.SYNC_STATES.UPDATE;
                bean.modifiedAt = 1234;
                bean.save(null, options);

                SugarTest.wait();

                runs(function() {
                    expect(bean.syncState).toBeNull();
                    expect(bean.modifiedAt).toBeNull();
                    expect(spySa.firstCall.calledWith("update", bean)).toBeTruthy();
                    expect(spyDm.callCount).toEqual(0);
                });
            });

            it("should be able to reset sync state of a bean in DELETED state", function() {
                var bean = new app.Offline.Bean({id: "foo"});
                bean.syncState = app.Offline.dataManager.SYNC_STATES.DELETE;
                bean.modifiedAt = 1234;
                bean.save(null, options);

                SugarTest.wait();

                runs(function() {
                    expect(bean.syncState).toBeNull();
                    expect(bean.modifiedAt).toBeNull();
                    expect(spySa.firstCall.calledWith("delete", bean)).toBeTruthy();
                    expect(spyDm.callCount).toEqual(0);
                });
            });


        });

    });

});
