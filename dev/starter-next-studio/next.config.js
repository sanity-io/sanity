module.exports = {
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
