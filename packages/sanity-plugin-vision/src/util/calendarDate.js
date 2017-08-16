import moment from 'moment'

function calendarDate(date) {
  return moment(date).calendar(null, {
    sameElse: 'YYYY-MM-DD HH:mm:ss'
  })
}

export default calendarDate
