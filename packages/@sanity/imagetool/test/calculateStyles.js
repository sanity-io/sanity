const calculateStyles = require('../src/calculateStyles');
require('should');

// Todo: write test for cropping container too

describe('calculateStyles', function () {

  describe('default aspect ratio', function () {
    it('defaults to the source image aspect ratio when no crop is given', function () {
      const style = calculateStyles({
        image: {height: 100, width: 100}
      })
      style.image.should.containEql({
        height: '100%',
        width: '100%'
      })
    })
    it('considers the cropping when calculating image aspect', function () {
      const style = calculateStyles({
        image: {height: 200, width: 100},
        hotspot: {
          x: 0.5,
          y: 0.5,
          height: 0.5,
          width: 0.5
        },
        crop: {
          top: 0.2,
          bottom: 0.2,
          left: 0.1,
          right: 0.1
        }
      })
      style.container.should.containEql({
        height: '150%',
        width: '100%'
      })
      style.image.should.containEql({
        height: '166.67%',
        left: '-12.5%',
        position: 'absolute',
        top: '-33.33%',
        width: '125%'
      })
    })
  })
  describe('landscape oriented images', function () {
    const image = {
      height: 100,
      width: 150
    };

    const hotspot = {
      height: 0.75,
      width: 0.5,
      x: 0.5,
      y: 0.5
    };

    it('displays well in a portrait oriented container', function () {
      const style = calculateStyles({
        hotspot,
        image,
        container: {
          height: 150,
          width: 100
        }
      });
      style.image.should.containEql({
        position: 'absolute',
        height: '100%',
        width: '100%',
        left: 0,
        top: 0
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '150%'
      });
    });

    it('display in a landscape oriented container', function () {
      const style = calculateStyles({
        hotspot,
        image,
        container: {
          height: 100,
          width: 150
        }
      });

      style.image.should.containEql({
        position: 'absolute',
        height: '100%',
        width: '100%',
        left: 0,
        top: 0
      });

      style.container.should.containEql({
        height: '66.67%',
        overflow: 'hidden',
        position: 'relative',
        width: '100%'
      });
    });

    it('display as a square', function () {
      const style = calculateStyles({
        hotspot,
        image,
        container: {
          height: 100,
          width: 100
        }
      });

      style.image.should.containEql({
        position: 'absolute',
        height: '100%',
        width: '100%',
        top: 0,
        left: 0
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '100%'
      });
    });
  });

  describe('portrait oriented images', function () {
    const image = {
      height: 150,
      width: 100
    };

    const hotspot = {
      height: 0.5,
      width: 0.5,
      x: 0.5,
      y: 0.5
    };

    it('display in a portrait oriented container', function () {
      const style = calculateStyles({
        hotspot,
        image,
        container: {
          height: 150,
          width: 100
        }
      });
      style.image.should.containEql({
        position: 'absolute',
        height: '100%',
        width: '100%',
        left: 0,
        top: 0
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '150%'
      });
    });

    it('display in a landscape oriented container', function () {
      const style = calculateStyles({
        hotspot,
        image,
        container: {
          height: 100,
          width: 150
        }
      });

      style.image.should.containEql({
        top: 0,
        left: 0,
        position: 'absolute',
        height: '100%',
        width: '100%'
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '66.67%'
      });
    });

    it('display as a square', function () {
      const style = calculateStyles({
        hotspot,
        image,
        container: {
          height: 100,
          width: 100
        }
      });

      style.image.should.containEql({
        position: 'absolute',
        height: '100%',
        width: '100%',
        top: 0,
        left: 0
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '100%'
      });
    });
  });

  describe('square images', function () {
    const image = {
      height: 100,
      width: 100
    };

    const hotspot = {
      height: 0.5,
      width: 0.5,
      x: 0.5,
      y: 0.5
    };

    it('display in a portrait oriented container', function () {
      const style = calculateStyles({
        hotspot,
        image,
        container: {
          height: 100,
          width: 100
        }
      });
      style.image.should.containEql({
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%'
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '100%'
      });
    });

    it('display in a landscape oriented container', function () {
      const style = calculateStyles({
        hotspot,
        image,
        container: {
          height: 100,
          width: 150
        }
      });

      style.image.should.containEql({
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: '100%'
      });

      style.container.should.containEql({
        overflow: 'hidden',
        position: 'relative',
        width: '100%',
        height: '66.67%'
      });
    });

    it('display as a square', function () {
      const style = calculateStyles({
        hotspot,
        image,
        container: {
          height: 100,
          width: 100
        }
      });

      style.image.should.containEql({
        top: 0,
        left: 0,
        height: '100%',
        width: '100%'
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
