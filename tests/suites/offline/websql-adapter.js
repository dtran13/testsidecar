// ****************************************************************
// *** THIS TEST SUITE ASSUMES THAT THE BROWSER SUPPORTS WEBSQL ***
// ****************************************************************

describe("Offline", function() {

    var app = SUGAR.App, db,
        handleError = function(message, spec, tx, e) {
            if (!e) e = tx;
            e = e ? ("[" + e.code + "]-" + e.message) : "<no error>";
            spec.fail(message + ": " + e);
        };

    beforeEach(function() {
        db = app.webSqlAdapter;
        db.open("websql-test", "1.0", 1024);
        var spec = this,
            done = false,
            statements = [
                'DROP TABLE IF EXISTS "test"',
                'CREATE TABLE "test" ("id" TEXT PRIMARY KEY COLLATE NOCASE,"ifield" INTEGER,"sfield" TEXT,"rfield" REAL, "foo" TEXT)',
                'ALTER TABLE "test" ADD COLUMN "bfield" INTEGER'
            ];
        runs(function() {
            db.executeStatements(undefined, statements,
                function() {
                    done = true;
                },
                function(tx, e) {
                    handleError("Failed to clean db", spec, tx, e);
                    done = true;
                }
            );
        });

        waitsFor(function() {
            return done;
        });
    });

    it("should be able to execute query with params", function() {
        var done = false, spec = this, records;
        db.executeSql(undefined, "INSERT INTO test (id, ifield, sfield, rfield, bfield) VALUES (?,?,?,?,?)", ['bar', 7, 'foo', 3.14, true],
            function() {
                done = true;
            },
            function(tx, e) {
                handleError("Failed to insert record", spec, tx, e);
                done = true;
            }
        );

        waitsFor(function() {
            return done;
        });

        runs(function() {
            done = false;
            db.executeSql(undefined, "SELECT * FROM test WHERE id='bar'", null,
                function(tx, recordSet) {
                    records = recordSet;
                    done = true;
                },
                function(tx, e) {
                    handleError("Failed to select record", spec, tx, e);
                    done = true;
                }
            );
        });

        waitsFor(function() {
            return done;
        });

        runs(function() {
            expect(records).toBeDefined();
            expect(records.rows.length).toEqual(1);
            var attrs = records.rows.item(0);
            expect(attrs.id).toEqual("bar");
            expect(attrs.ifield).toEqual(7);
            expect(attrs.sfield).toEqual("foo");
            expect(attrs.rfield).toEqual(3.14);
            expect(attrs.bfield).toEqual(1);
        });

    });


    xit("should be able to execute a callback in a transaction", function() {
        var done = false, spec = this, records, success;

        db.executeInTransaction(
            function(tx) {
                db.executeStatement(tx, "INSERT INTO test (id) VALUES (?)", ['bar']);
            },
            function() {
                done = true;
                success = true;
            },
            function(tx, e) {
                handleError("Failed to insert record", spec, tx, e);
                done = true;
            }
        );

        waitsFor(function() {
            return done;
        });

        runs(function() {
            done = false;
            db.executeSql(undefined, "SELECT * FROM test", null,
                function(tx, recordSet) {
                    records = recordSet;
                    done = true;
                },
                function(tx, e) {
                    handleError("Failed to select record", spec, tx, e);
                    done = true;
                }
            );
        });

        waitsFor(function() {
            return done;
        });

        runs(function() {
            expect(records).toBeDefined();
            expect(records.rows.length).toEqual(1);
            var attrs = records.rows.item(0);
            expect(attrs.id).toEqual("bar");
        });
    });

});
