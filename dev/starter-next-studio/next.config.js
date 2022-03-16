module.exports = {
  async redirects() {
    return [
      {
        // the studio will redirect to /desk after load, we do it here so it's already done before load
        source: '/studio',
        destination: '/studio/desk',
        permanent: false,
      },
    ]
  },
}
