


describe("timeago", function() {
       var log, sugardate, lang, template;
       beforeEach(function(){
           log  = {};
           log.debug = function() { };
           sugardate = {};
           sugardate.parse = function(date) { return new Date(date); };
           sugardate.format = function(date) { return new Date(date); };
           sugardate.UTCtoLocalTime = function(date) { return new Date(date + ' UTC'); };
           sugardate.getRelativeTimeLabel = function(date) { return { str : "LBL_TEST_TIME_AGO", value: undefined};};
           template = {};
           template.compile = function(key, tpl) {return Handlebars.compile(tpl); };
           lang = {};
           lang.get = function(msg){
               var labels ={
                              LBL_TEST_TIME_AGO:'A LONG TIME AGO',
                              LBL_TIME_RELATIVE: 'Posted {{relativetime}} on {{date}} at {{time}}',
                              LBL_LAST_TOUCHED:'Last touched {{relativetime}} on {{date}} at {{time}}'
                          }
               return labels[msg]};
       });



      it("should convert a date into a relative time", function() {
        var date = "2012-06-14 23:58:29";
        var $time = $("<span class=\"relativetime\" title=\"" + date + "\">" + date + "</span>");
        var origValue = $time.text();
        $time.timeago({
            logger: log,
            date: sugardate,
            lang:lang,
            template: template
        });
        expect($time.text()).not.toEqual(origValue);
        expect($time.text()).toContain("Posted");
        expect($time.text()).toContain("A LONG TIME AGO");
    });

    it("should be able to take in an alternative label", function() {
        var date = "2012-06-14 23:58:29";
        var $time = $("<span class=\"relativetime\" data-label=\"LBL_LAST_TOUCHED\" title=\"" + date + "\">" + date + "</span>");
        $time.timeago({
            logger: log,
            date: sugardate,
            lang:lang,
            template: template
        })
        expect($time.text()).toContain("Last touched");
    });

});
