describe("Offline", function() {

    var app = SUGAR.App, origWebSqlAdapter = app.webSqlAdapter, spec = this, db;

    // WebSQL adapter stub
    db = {
        tx: null,
        recordSet: null,

        open: function() {
        },

        executeInTransaction: function(callback, success, failure) {
            _.defer(callback);
            if (success) _.delay(success, 20, this.tx, this.recordSet);
        },

        executeStatements: function(tx, statements, success, failure) {
            if (success) _.delay(success, 20, tx, this.recordSet);
        },

        executeStatement: function(tx, stmt, params) {
            if (success) _.delay(success, 20, tx, this.recordSet);
        },

        executeSql: function(tx, sql, params, success, failure) {
            if (success) _.delay(success, 20, tx, this.recordSet);
        }
    };


    describe("SqlHelper", function() {
        var metadata, sqlHelper;

        beforeEach(function() {
            app.init({el: "body"});
            metadata = SugarTest.loadFixture("things-metadata");
            sqlHelper = new app.Offline.SqlHelper("Thing", metadata["Things"].beans["Thing"]);
        });

        it("should able to build SQL statements", function() {
            expect(sqlHelper.sqlCreate).toEqual('INSERT INTO "d_Thing" ("id","_sync_state","_modified_at","name","int_field","currency_field","relate_field","bool_field") VALUES (?,?,?,?,?,?,?,?)');
            expect(sqlHelper.sqlReplace).toEqual('REPLACE INTO "d_Thing" ("id","_sync_state","_modified_at","name","int_field","currency_field","relate_field","bool_field") VALUES (?,?,?,?,?,?,?,?)');
            expect(sqlHelper.sqlUpdate).toEqual('UPDATE "d_Thing" SET "id"=?,"_sync_state"=?,"_modified_at"=?,"name"=?,"int_field"=?,"currency_field"=?,"relate_field"=?,"bool_field"=? WHERE id=?');
            expect(sqlHelper.sqlDelete).toEqual('DELETE FROM "d_Thing" WHERE id=?');
            expect(sqlHelper.sqlSelectOne).toEqual('SELECT * FROM "d_Thing" WHERE id=?');
            expect(sqlHelper.sqlSelectMany).toEqual('SELECT * FROM "d_Thing"');
        });

        it("should able to build SQL schema statements", function() {
            var statements = sqlHelper.getSchema();

            expect(statements.length).toEqual(4);
            expect(statements[0]).toEqual('DROP TABLE IF EXISTS "d_Thing"');
            expect(statements[1]).toEqual('CREATE TABLE "d_Thing" ("id" TEXT PRIMARY KEY COLLATE NOCASE,"_sync_state" INTEGER,"_modified_at" INTEGER,"name" TEXT COLLATE NOCASE,"int_field" INTEGER,"currency_field" REAL,"relate_field" TEXT COLLATE NOCASE,"bool_field" INTEGER)');
            expect(statements[2]).toEqual('DROP INDEX IF EXISTS Thing_name_IDX');
            expect(statements[3]).toEqual('CREATE INDEX Thing_name_IDX ON "d_Thing" ("name" COLLATE NOCASE)');
        });

    });

    describe("StorageAdapter", function() {

        var dbSpy,
            dm = app.dataManager, sa = app.Offline.storageAdapter,
            options = {
                success: function() {
                    SugarTest.setWaitFlag();
                }
            };

        beforeEach(function() {
            app.webSqlAdapter = db;
            app.dataManager.beanModel = app.Offline.Bean;

            var metadata = SugarTest.loadFixture("things-metadata");
            sa.open();
            sa.migrate(metadata);
            dm.declareModels(metadata);
            dbSpy = sinon.spy(db, "executeSql");
        });

        afterEach(function() {
            if (db.executeSql.restore) db.executeSql.restore();
            app.webSqlAdapter = origWebSqlAdapter;
        });

        it("should be able to insert a bean", function() {
            var bean = dm.createBean("Things", {
                name: "My thing",
                int_field: 7,
                currency_field: 3.14,
                relate_field: "foo",
                bool_field: true
            });


            runs(function() {
                sa.sync("create", bean, options);
            });

            SugarTest.wait();

            runs(function() {
                var args = dbSpy.firstCall.args,
                    params = args[2];
                expect(args[1]).toContain("INSERT");
                expect(params.length).toEqual(8);
                expect(params[0]).toBeDefined();
                expect(params[1]).toBeNull();
                expect(params[2]).toBeNull();
                expect(params[3]).toEqual("My thing");
                expect(params[4]).toEqual(7);
                expect(params[5]).toEqual(3.14);
                expect(params[6]).toEqual("foo");
                expect(params[7]).toEqual(true);
            });

        });

        it("should be able to update a bean", function() {
            var bean = dm.createBean("Things", {
                id: "axe",
                name: "My thing",
                int_field: 7,
                currency_field: 3.14,
                relate_field: "foo",
                bool_field: false
            });

            runs(function() {
                sa.sync("update", bean, options);
            });

            SugarTest.wait();

            runs(function() {
                var args = dbSpy.firstCall.args,
                    params = args[2];
                expect(args[1]).toContain("UPDATE");
                expect(params.length).toEqual(9);
                expect(params[0]).toEqual("axe");
                expect(params[1]).toBeNull();
                expect(params[2]).toBeNull();
                expect(params[3]).toEqual("My thing");
                expect(params[4]).toEqual(7);
                expect(params[5]).toEqual(3.14);
                expect(params[6]).toEqual("foo");
                expect(params[7]).toEqual(false);
                expect(params[8]).toEqual("axe");
            });
        });

        it("should be able to replace a bean", function() {
            var bean = dm.createBean("Things", {
                id: "axe",
                name: "My thing",
                int_field: 7,
                currency_field: 3.14,
                relate_field: "foo",
                bool_field: true
            });

            runs(function() {
                sa.sync("update", bean, _.extend(options, { oldId: "axe" }));
            });

            SugarTest.wait();

            runs(function() {
                var args = dbSpy.firstCall.args,
                    params = args[2];
                expect(args[1]).toContain("REPLACE");
                expect(params.length).toEqual(8);
                expect(params[0]).toEqual("axe");
                expect(params[1]).toBeNull();
                expect(params[2]).toBeNull();
                expect(params[3]).toEqual("My thing");
                expect(params[4]).toEqual(7);
                expect(params[5]).toEqual(3.14);
                expect(params[6]).toEqual("foo");
                expect(params[7]).toEqual(true);
            });
        });

        it("should be able to delete a bean", function() {
            var bean = dm.createBean("Things", {
                id: "axe"
            });

            runs(function() {
                sa.sync("delete", bean, options);
            });

            SugarTest.wait();

            runs(function() {
                var args = dbSpy.firstCall.args,
                    params = args[2];
                expect(args[1]).toContain("DELETE");
                expect(params.length).toEqual(1);
                expect(params[0]).toEqual("axe");
            });
        });

        it("should be able to fetch a bean", function() {
            var bean = dm.createBean("Things", {
                id: "axe"
            });

            runs(function() {
                sa.sync("read", bean, options);
            });

            SugarTest.wait();

            runs(function() {
                var args = dbSpy.firstCall.args,
                    params = args[2];
                expect(args[1]).toContain("SELECT");
                expect(params.length).toEqual(1);
                expect(params[0]).toEqual("axe");
            });
        });

        it("should be able to fetch beans", function() {
            var bean = dm.createBeanCollection("Things");

            runs(function() {
                sa.sync("read", bean, options);
            });

            SugarTest.wait();

            runs(function() {
                var args = dbSpy.firstCall.args;
                expect(args[1]).toContain("SELECT");
            });
        });

    });

    describe("DataManager", function() {

        var dbSpy, metadata,
            odm = app.Offline.dataManager,
            dm = app.dataManager;

        beforeEach(function() {
            metadata = SugarTest.loadFixture("metadata");
            app.webSqlAdapter = db;
            dm.init();
            dbSpy = sinon.spy(db, "executeStatements");
        });

        afterEach(function() {
            if (db.executeStatements.restore) db.executeStatements.restore();
            app.webSqlAdapter = origWebSqlAdapter;
        });

        it("should be able to create db schema and declare models", function() {
            runs(function() {
                odm.migrate(metadata, {
                    callback: function(error) {
                        if (error) {
                            spec.fail("Failed to migrate: " + error);
                        }
                        else {
                            dm.declareModels(metadata);
                            SugarTest.setWaitFlag();
                        }
                    }
                });
            });

            SugarTest.wait();

            runs(function() {
                expect(dbSpy.firstCall).toBeDefined();
                var args = dbSpy.firstCall.args, statements;
                expect(args[0]).toBeNull();
                statements = args[1];
                expect(statements.length).toEqual(14);

                _.each(_.keys(metadata), function(moduleName) {
                    var bean = dm.createBean(moduleName, {});
                    expect(bean).toBeDefined();
                    expect(bean instanceof app.Offline.Bean).toBeTruthy();
                    expect(dm.createBeanCollection(moduleName)).toBeDefined();
                });
            });
        });

    });


});
