module.exports = {
  env: {
    // Matches the behavior of `sanity dev` which sets styled-components to use the fastest way of inserting CSS rules in both dev and production. It's default behavior is to disable it in dev mode.
    SC_DISABLE_SPEEDY: 'false',
  },
  async redirects() {
    return [
      {
        // the studio will redirect to /structure after load, we do it here so it's already done before load
        source: '/studio',
        destination: '/studio/structure',
        permanent: false,
      },
    ]
  },
}
