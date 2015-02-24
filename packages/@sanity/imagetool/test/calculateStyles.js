var calculateStyles = require('../calculateStyles');
var should = require('should');

describe('calculateStyles', function() {

  describe('landscape oriented images', function() {
    var image = {
      height: 100,
      width: 150
    };
    var hotspot = {
      height: 0.75,
      width: 0.5,
      x: 0.5,
      y: 0.5
    };

    it('displays well in a portrait oriented container', function() {
      var style = calculateStyles({
        hotspot: hotspot,
        image: image,
        container: {
          height: 150,
          width: 100
        }
      });
      style.image.should.containEql({
        position: 'absolute',
        top: '-16.67%',
        left: '-100%',
        height: '133.33%',
        width: '300%'
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '150%'
      });
    });

    it('display in a landscape oriented container', function() {
      var style = calculateStyles({
        hotspot: hotspot,
        image: image,
        container: {
          height: 100,
          width: 150
        }
      });

      style.image.should.containEql({
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        height: '200%',
        width: '200%'
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '66.67%'
      });
    });

    it('display as a square', function() {
      var style = calculateStyles({
        hotspot: hotspot,
        image: image,
        container: {
          height: 100,
          width: 100
        }
      });

      style.image.should.containEql({
        position: 'absolute',
        top: '-16.67%',
        left: '-50%',
        height: '133.33%',
        width: '200%'
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '100%'
      });
    });
  });

  describe('portrait oriented images', function() {
    var image = {
      height: 150,
      width: 100
    };

    var hotspot = {
      height: 0.5,
      width: 0.5,
      x: 0.5,
      y: 0.5
    };

    it('display in a portrait oriented container', function() {
      var style = calculateStyles({
        hotspot: hotspot,
        image: image,
        container: {
          height: 150,
          width: 100
        }
      });
      style.image.should.containEql({
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        height: '200%',
        width: '200%'
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '150%'
      });
    });

    it('display in a landscape oriented container', function() {
      var style = calculateStyles({
        hotspot: hotspot,
        image: image,
        container: {
          height: 100,
          width: 150
        }
      });

      style.image.should.containEql({
        position: 'absolute',
        top: '-175%',
        left: '-50%',
        height: '450%',
        width: '200%'
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '66.67%'
      });
    });

    it('display as a square', function() {
      var style = calculateStyles({
        hotspot: hotspot,
        image: image,
        container: {
          height: 100,
          width: 100
        }
      });

      style.image.should.containEql({
        position: 'absolute',
        top: '-100%',
        left: '-50%',
        height: '300%',
        width: '200%'
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '100%'
      });
    });
  });

  describe('square images', function() {
    var image = {
      height: 100,
      width: 100
    };

    var hotspot = {
      height: 0.5,
      width: 0.5,
      x: 0.5,
      y: 0.5
    };

    it('display in a portrait oriented container', function() {
      var style = calculateStyles({
        hotspot: hotspot,
        image: image,
        container: {
          height: 100,
          width: 100
        }
      });
      style.image.should.containEql({
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        height: '200%',
        width: '200%'
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '100%'
      });
    });

    it('display in a landscape oriented container', function() {
      var style = calculateStyles({
        hotspot: hotspot,
        image: image,
        container: {
          height: 100,
          width: 150
        }
      });

      style.image.should.containEql({
        position: 'absolute',
        top: '-100%',
        left: '-50%',
        height: '300%',
        width: '200%'
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '66.67%'
      });
    });

    it('display as a square', function() {
      var style = calculateStyles({
        hotspot: hotspot,
        image: image,
        container: {
          height: 100,
          width: 100
        }
      });

      style.image.should.containEql({
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        height: '200%',
        width: '200%'
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '100%'
      });
    });
  });
});