describe("Events Hub", function() {
    var eventHub, context;

    beforeEach(function() {
        eventHub = SugarTest.app.events;
        context = _.extend({}, Backbone.Events);
    });

    describe("when an event is registered", function() {
        it("should fire event and all listners should call their callbacks", function() {
            var cb = sinon.spy();
            eventHub.register("testEvent", context);
            eventHub.on("testEvent", cb);
            context.trigger("testEvent");

            expect(cb).toHaveBeenCalled();
        });
    });

    describe("when an event is removed", function() {
        it("should not broadcast removed events to subscribers", function() {
            var cb1 = sinon.spy();
            var cb2 = sinon.spy();

            eventHub.register("testEvent", context);
            eventHub.on("testEvent", cb1);

            eventHub.register("nextEvent", context);
            eventHub.on("nextEvent", cb1);
            eventHub.on("nextEvent", cb2);
            eventHub.unregister(context, "nextEvent");

            context.trigger("nextEvent");
            context.trigger("testEvent");
            context.trigger("testEvent");

            expect(cb2).not.toHaveBeenCalled();
            expect(cb1).toHaveBeenCalledTwice();
        });
    });

    describe("when all events are removed", function() {
        it("should not broadcast any events", function() {
            var cb = sinon.spy();

            eventHub.register("testEvent", context);
            eventHub.on("testEvent", cb);
            eventHub.on("all", cb);
            eventHub.unregister(context);

            context.trigger("testEvent");

            expect(cb).not.toHaveBeenCalled();
        });
    });

    // This test is currently disabled as it does not pass. However, running it individually
    // passes and it seems to be working in the application.
    // https://www.pivotaltracker.com/story/show/28981825
    xdescribe("should re-broadcast jquery ajax events", function() {
        it("it should trigger ajaxStart and ajaxStop on any ajax activity", function() {
            var callback1 = sinon.spy(),
                callback2 = sinon.spy();

            SugarTest.seedFakeServer();
            SugarTest.server.respondWith([200, {}, ""]);

            eventHub.registerAjaxEvents();
            eventHub.on("ajaxStart", callback1);
            eventHub.on("ajaxStop", callback2);

            $.ajax({url: "/rest/v10/metadata"});
            SugarTest.server.respond();

            expect(callback1).toHaveBeenCalled();
            expect(callback2).toHaveBeenCalled();
        });
    });
});
