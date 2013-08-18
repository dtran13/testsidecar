describe("User", function() {

    var app, user;

    beforeEach(function() {
        app = SugarTest.app;
        user = app.user;
    });

    it("should be able to get, set, and unset attributes", function() {
        user.set('foo', 'foo value');
        user.set('bar', 'bar value');
        expect(user.get('foo')).toEqual('foo value');
        expect(user.get('bar')).toEqual('bar value');

        user.unset("bar");
        expect(user.get('bar')).toBeUndefined();
    });

    it("should not nuke old user app settings but should reset server settings", function() {
        user.set("non-server-setting", "foo");

        user.set({
            id: "1",
            full_name: "Administrator 2"
        });

        expect(user.get('id')).toEqual("1");
        expect(user.get('full_name')).toEqual("Administrator 2");
        expect(user.get('non-server-setting')).toEqual("foo");
    });

    it("should reset and clear user on logout if clear flag", function() {
        app.events.trigger("app:logout", true);
        expect(user.get('id')).toBeUndefined();
    });
    it("should load user and verify the language", function() {

        var spy = sinon.spy(app.user, "set");
        var stub = sinon.stub(app.lang, "setLanguage");
        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("GET", /.*\/rest\/v10\/me.*/,
            [200, {  "Content-Type": "application/json"},
                JSON.stringify(fixtures.api["/rest/v10/me"].GET.response)]);

        app.lang.currentLanguage = 'en_us';
        app.user.load();
        SugarTest.server.respond();
        expect(spy).toHaveBeenCalled();
        expect(stub).not.toHaveBeenCalled();
        //Set current loaded language to fr_FR
        //The fixture returns en_us as the user preferred language, so setLanguage should have been called
        app.user.load();
        app.lang.currentLanguage = 'fr_FR';
        SugarTest.server.respond();
        expect(stub).toHaveBeenCalled();
        spy.restore();
        stub.restore();
    });

    it("should reset itself with new data", function() {

        var newData = {
            "current_user": {
                "id": "2",
                "full_name": "Vasia"
              }
        };

        user.set(newData.current_user);

        expect(user.get('id')).toEqual("2");
        expect(user.get('full_name')).toEqual("Vasia");
        expect(user.get('user_name')).toBeUndefined();
        expect(user.getPreference('timezone')).toBeUndefined();
        expect(user.getPreference('datepref')).toBeUndefined();
        expect(user.getPreference('timepref')).toBeUndefined();
    });

    /**
     * @see app/app.js language process
     */
    it("should update lang if server returns a different language than current language", function() {
        var clock = sinon.useFakeTimers();
        var callbackSpy = sinon.spy();
        var isAuthenticatedStub = sinon.stub(app.api, "isAuthenticated", function() { return true; });
        var ajaxSpy = sinon.spy($, 'ajax');
        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("PUT", /.*\/rest\/v10\/me.*/,
            [200, {"Content-Type": "application/json"},
                JSON.stringify({})]);
        app.user.updateLanguage("en_us", callbackSpy);
        SugarTest.server.respond();
        clock.tick(50);
        expect(app.user.getPreference("language")).toEqual("en_us");
        expect(app.cache.get("lang")).toEqual("en_us");
        expect(ajaxSpy).toHaveBeenCalledOnce();
        ajaxSpy.restore();
        isAuthenticatedStub.restore();
        clock.restore();
    });

    it("should update user's profile", function() {
        var clock = sinon.useFakeTimers();
        var callbackSpy = sinon.spy();
        var payload = {
            first_name: "Johnny",
            last_name: "Administrator",
            email: [
                {
                    email_address: "johnny@bgoode.com",
                    primary_address: "1",
                    hasAnchor: true,
                    flagLabel: "(Primary)"
                }
            ],
            phone_work: "213-555-1212"
        };
        var isAuthenticatedStub = sinon.stub(app.api, "isAuthenticated", function() { return true; });
        var ajaxSpy = sinon.spy($, 'ajax');
        SugarTest.seedFakeServer();
        SugarTest.server.respondWith("PUT", /.*\/rest\/v10\/me.*/,
            [200, {"Content-Type": "application/json"},
                JSON.stringify({})]);
        app.user.updateProfile(payload, callbackSpy);
        SugarTest.server.respond();
        clock.tick(50);
        expect(callbackSpy).toHaveBeenCalledOnce();
        expect(isAuthenticatedStub).toHaveBeenCalledOnce();
        expect(ajaxSpy).toHaveBeenCalledOnce();
        ajaxSpy.restore();
        isAuthenticatedStub.restore();
        clock.restore();
    });

    it("should be able to update lang without udpating the user", function() {
        var spy = sinon.spy(app.api, 'me');

        expect(app.user.getPreference("language")).toEqual("en_us");
        expect(spy).not.toHaveBeenCalledOnce();
        spy.restore();
    });

    describe('Get last state key', function() {
        it("should return the last state key when given a key name, the last state ID, and module via component object", function() {
            var lastStateKey = user.lastState.key('bar', {
                meta: {
                    last_state: {
                        id: 'foo'
                    }
                },
                module: 'Accounts'
            });

            expect(lastStateKey).toBe('Accounts:foo:bar');
        });

        it("should return the last state key when given a key name and the last state ID via component object", function() {
            var lastStateKey = user.lastState.key('bar', {
                meta: {
                    last_state: {
                        id: 'foo'
                    }
                }
            });

            expect(lastStateKey).toBe('foo:bar');
        });

        it("should return undefined when the last state ID has not been set via component object", function() {
            var lastStateKey = user.lastState.key('bar', {});
            expect(lastStateKey).not.toBeDefined();
        });

        it("should return the last state key when given a key name, the last state ID, and module directly", function() {
            var lastStateKey = user.lastState.buildKey('bar', 'foo', 'Accounts');
            expect(lastStateKey).toBe('Accounts:foo:bar');
        });

        it("should return the last state key when given a key name and the last state ID directly", function() {
            var lastStateKey = user.lastState.buildKey('bar', 'foo');
            expect(lastStateKey).toBe('foo:bar');
        });
    });

    describe('Register default last states', function() {
        it("should register defaults for last states when given last state ID and defaults", function() {
            var component = {
                meta: {
                    last_state: {
                        id: 'foo',
                        defaults: {
                            one: 'value_one',
                            two: 'value_two'
                        }
                    }
                },
                module: 'Accounts'
            };

            user.lastState.register(component);

            var key1 = user.lastState.key('one', component);
            var key2 = user.lastState.key('two', component);

            expect(user.lastState.defaults(key1)).toBe('value_one');
            expect(user.lastState.defaults(key2)).toBe('value_two');
        });

        it("should not register defaults last states when defaults are not given", function() {
            var component = {
                meta: {
                    last_state: {
                        id: 'foo'
                    }
                }
            };

            user.lastState.register(component);

            var key = user.lastState.key('bar', component);
            expect(user.lastState.defaults(key)).not.toBeDefined();
        });
    });

    describe('Set and get last states', function() {
        var module = 'Contacts';

        it("should get last state that was set when last state ID exists and module is specified", function() {
            var component = {
                meta: {
                    last_state: {
                        id: 'test'
                    }
                },
                module: module
            };

            var key = user.lastState.key('foo', component);

            user.lastState.set(key, 'bar');
            expect(user.lastState.get(key)).toBe('bar');

            user.lastState.remove(key);
        });

        it("should get last state that was set when last state ID exists and module is not specified", function() {
            var component = {
                meta: {
                    last_state: {
                        id: 'test'
                    }
                }
            };

            var key = user.lastState.key('foo', component);

            user.lastState.set(key, 'bar');
            expect(user.lastState.get(key)).toBe('bar');

            user.lastState.remove(key);
        });

        it("should set different values for each module", function() {
            var component1 = {
                meta: {
                    last_state: {
                        id: 'test'
                    }
                },
                module: 'Accounts'
            };

            var component2 = {
                meta: {
                    last_state: {
                        id: 'test'
                    }
                },
                module: 'Leads'
            };

            var key1 = user.lastState.key('foo', component1);
            var key2 = user.lastState.key('foo', component2);

            user.lastState.set(key1, 'one');
            user.lastState.set(key2, 'two');

            expect(user.lastState.get(key1)).toBe('one');
            expect(user.lastState.get(key2)).toBe('two');

            user.lastState.remove(key1);
            user.lastState.remove(key2);
        });

        it("should set different values for when module is and is not specified", function() {
            var component1 = {
                meta: {
                    last_state: {
                        id: 'test'
                    }
                },
                module: module
            };

            var component2 = {
                meta: {
                    last_state: {
                        id: 'test'
                    }
                }
            };

            var key1 = user.lastState.key('foo', component1);
            var key2 = user.lastState.key('foo', component2);

            user.lastState.set(key1, 'one');
            user.lastState.set(key2, 'two');

            expect(user.lastState.get(key1)).toBe('one');
            expect(user.lastState.get(key2)).toBe('two');

            user.lastState.remove(key1);
            user.lastState.remove(key2);
        });

        it("should get the default value if last state value doesn't exist in local storage", function() {
            var component = {
                meta: {
                    last_state: {
                        id: 'foo',
                        defaults: {
                            one: 'value_one',
                            two: 'value_two'
                        }
                    }
                },
                module: module
            };

            user.lastState.register(component);

            var key1 = user.lastState.key('one', component);
            var key2 = user.lastState.key('two', component);

            expect(user.lastState.get(key1)).toBe('value_one');
            expect(user.lastState.get(key2)).toBe('value_two');
        });
    });

    describe('Remove last states', function() {
        it("should delete last state that was set when last state ID exists and module is specified", function() {
            var component = {
                meta: {
                    last_state: {
                        id: 'test'
                    }
                },
                module: 'Contacts'
            };

            var key = user.lastState.key('foo', component);

            expect(user.lastState.get(key)).not.toBeDefined();

            user.lastState.set(key, 'bar');
            expect(user.lastState.get(key)).toBe('bar');

            user.lastState.remove(key);
            expect(user.lastState.get(key)).not.toBeDefined();
        });

        it("should delete last state that was set when last state ID exists and module is not specified", function() {
            var component = {
                meta: {
                    last_state: {
                        id: 'test'
                    }
                }
            };

            var key = user.lastState.key('foo', component);

            expect(user.lastState.get(key)).not.toBeDefined();

            user.lastState.set(key, 'bar');
            expect(user.lastState.get(key)).toBe('bar');

            user.lastState.remove(key);
            expect(user.lastState.get(key)).not.toBeDefined();
        });
    });

});
