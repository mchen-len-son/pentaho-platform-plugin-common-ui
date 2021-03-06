define([
  "pentaho/visual/base/View",
  "pentaho/visual/base",
  "pentaho/type/Context",
  "pentaho/type/events/DidChange",
  "tests/pentaho/util/errorMatch"
], function(View, modelFactory, Context, DidChange, errorMatch) {
  "use strict";

  /*global document:false*/

  describe("pentaho/visual/base/View", function() {
    var element, Model, model;

    beforeEach(function() {
      element = document.createElement("div");
      var dataTableSpec = {
        model: [
          {name: "country", type: "string", label: "Country"},
          {name: "sales", type: "number", label: "Sales"}
        ],
        rows: [
          {c: [{v: "Portugal"}, {v: 12000}]},
          {c: [{v: "Ireland"}, {v: 6000}]}
        ]
      };
      var dataSpec = {
        width: 1,
        height: 1,
        data: {
          v: dataTableSpec
        }
      };
      var context = new Context();
      Model = context.get(modelFactory);
      model = new Model(dataSpec);
    });

    describe("the constructor ", function() {

      it("should throw if invoked with less than two arguments", function() {
        expect(function() {
          return new View();
        }).toThrow(errorMatch.argRequired("element"));

        expect(function() {
          return new View(element);
        }).toThrow(errorMatch.argRequired("model"));

        expect(function() {
          return new View(element, model);
        }).not.toThrow();
      });

      it("should throw if the first argument is not a DOM element", function() {
        [
          "div", 1, true, {}, []
        ].forEach(function(elem) {
          expect(function() {
            return new View(elem, model);
          }).toThrow(errorMatch.argInvalidType("element", "HTMLElement", typeof elem));
        });
      });

    });

    describe("validation: ", function() {

      it("should be valid if the model is valid", function(){
        var view = new View(element, model);
        expect(model.validate()).toBeNull(); //Null === no errors
        expect(view._isValid()).toBe(true);
      });

      it("should be invalid if the model is invalid", function(){
        var model = new Model();
        var view = new View(element, model);
        expect(model.validate()).not.toBeNull(); //Null === no errors
        expect(view._isValid()).toBe(false);
      });

      it("`render()` should invoke `_render` if the view is valid", function(done) {
        var DerivedView = View.extend({
          _render: function(){ return "Rendered"; }
        });
        var view = new DerivedView(element, model);

        spyOn(view, '_render').and.callThrough();

        view.render().then(function resolved() {
          expect(view._render).toHaveBeenCalled();
          done();
        }, function rejected() {
          done.fail();
        });
      });

      it("`render()` should not invoke `_render` if the view is invalid", function(done) {
        var DerivedView = View.extend({
          _validate: function(){ return ["Some error"]; },
          _render: function(){ return "Rendered"; }
        });
        var view = new DerivedView(element, model);

        spyOn(view, '_render').and.callThrough();

        view.render().then(function resolved() {
          done.fail();
        }, function rejected(reason) {
          expect(reason.join('')).toBe("Some error");
          expect(view._render).not.toHaveBeenCalled();
          done();
        });

      });

      it("`render()` should not invoke `_render` if `_validate` throws", function(done) {
        var DerivedView = View.extend({
          _validate: function(){ throw new Error("Some error"); },
          _render: function(){ return "Rendered"; }
        });
        var view = new DerivedView(element, model);

        spyOn(view, '_render').and.callThrough();

        view.render().then(function resolved() {
          done.fail();
        }, function rejected(reason) {
          expect(reason).toBe("Some error");
          expect(view._render).not.toHaveBeenCalled();
          done();
        });

      });


    });

    describe("#_onChange", function(){
      var view, _resize, _render, _selectionChanged;
      beforeEach(function(){
        view = new View(element, model);
        _resize = spyOn(view, "_resize");
        _selectionChanged = spyOn(view, "_selectionChanged");
        _render = spyOn(view, "_render");
      });

      it("triggers #_resize when only 'height' changes", function(){
        model.set("height", 100);

        expect(_resize).toHaveBeenCalled();
        expect(_selectionChanged).not.toHaveBeenCalled();
        expect(_render).not.toHaveBeenCalled();
      });

      it("triggers #_resize when only 'width' changes", function(){
        model.set("width", 100);

        expect(_resize).toHaveBeenCalled();
        expect(_selectionChanged).not.toHaveBeenCalled();
        expect(_render).not.toHaveBeenCalled();
      });

      it("triggers #_selectionChanged when 'selectionFilter' changes", function(){
        model.set("selectionFilter", null);

        expect(_resize).not.toHaveBeenCalled();
        expect(_selectionChanged).toHaveBeenCalled();
        expect(_render).not.toHaveBeenCalled();
      });

      it("does not trigger any render method when 'selectionMode' changes", function(){
        model.set("selectionMode", null);

        expect(_resize).not.toHaveBeenCalled();
        expect(_selectionChanged).not.toHaveBeenCalled();
        expect(_render).not.toHaveBeenCalled();
      });

      it("triggers #_render when a property other than 'height', 'width' or 'selectionFilter' changes", function(){
        model.set("isInteractive", false);

        expect(_resize).not.toHaveBeenCalled();
        expect(_selectionChanged).not.toHaveBeenCalled();
        expect(_render).toHaveBeenCalled();
      });

    }); // #_onChange
  });

});
