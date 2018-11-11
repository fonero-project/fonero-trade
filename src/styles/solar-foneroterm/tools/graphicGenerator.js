const glob = require('glob');
const sizeOf = require('image-size');
const path = require('path');

// PREREQUISITE: Install the npm package image-size and glob before running this

// currently only support for .png. .svg will be added when used
glob(`${__dirname}/../graphics/**/*.png`, (er, files) => {
  files.forEach((filepath) => {
    const filename = path.basename(filepath);
    const basename = path.basename(filepath, '.png');
    const dimensions = sizeOf(filepath);
    console.log(`.so-graphic-${basename
      } { @include so-graphic("${filename
      }", ${dimensions.width}, ${dimensions.height}); @extend .so-graphic; }`);
  });
});
