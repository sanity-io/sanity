const operators = { asc: '>', desc: '<' };
const inverted = { asc: '<', desc: '>' };

module.exports = (order, options) => {
  const { invert, orEqual } = options;
  const suffix = orEqual ? '=' : '';
  const source = invert ? inverted : operators;
  return `${source[order]}${suffix}`;
};