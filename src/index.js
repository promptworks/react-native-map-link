/**
 * React Native Map Link
 */

import { Linking } from 'react-native'

import { prefixes, isIOS } from './constants'
import { askAppChoice, checkOptions } from './utils'

/**
 * Open a maps app, or let the user choose what app to open, with the given location.
 *
 * @param {{
 *     latitude: number | string,
 *     longitude: number | string,
 *     sourceLatitude: number | undefined | null,
 *     sourceLongitude: number | undefined | null,
 *     googleForceLatLon: boolean | undefined | null,
 *     googlePlaceId: number | undefined | null,
 *     title: string | undefined | null,
 *     app: string | undefined | null
 *     dialogTitle: string | undefined | null
 *     dialogMessage: string | undefined | null
 *     cancelText: string | undefined | null
 *     appsWhiteList: array | undefined | null
 * }} options
 */
export async function showLocation (options) {
  checkOptions(options)

  let useSourceDestiny = false
  let sourceLat
  let sourceLng
  let sourceLatLng

  if (('sourceLatitude' in options) && ('sourceLongitude' in options)) {
    useSourceDestiny = true
    sourceLat = parseFloat(options.sourceLatitude)
    sourceLng = parseFloat(options.sourceLongitude)
    sourceLatLng = `${sourceLat},${sourceLng}`
  }

  let lat = parseFloat(options.latitude)
  let lng = parseFloat(options.longitude)
  let latlng = `${lat},${lng}`
  let title = options.title && options.title.length ? options.title : null
  let encodedTitle = encodeURIComponent(title)
  let app = options.app && options.app.length ? options.app : null
  let dialogTitle = options.dialogTitle && options.dialogTitle.length ? options.dialogTitle : 'Open in Maps'
  let dialogMessage = options.dialogMessage && options.dialogMessage.length ? options.dialogMessage : 'What app would you like to use?'
  let cancelText = options.cancelText && options.cancelText.length ? options.cancelText : 'Cancel'
  let appsWhiteList = options.appsWhiteList && options.appsWhiteList.length ? options.appsWhiteList : null

  if (!app) {
    app = await askAppChoice({
      dialogTitle,
      dialogMessage,
      cancelText,
      appsWhiteList
    })
  }

  let url = null

  switch (app) {
    case 'apple-maps':
      // url = prefixes['apple-maps']
      // url = (useSourceDestiny) ? `${url}?saddr=${sourceLatLng}&daddr=${latlng}` : `${url}?ll=${latlng}`
      // url += `&q=${title ? `${encodedTitle}&address=${encodedTitle}` : 'Location'}`

      /**
       * The above logic was replaced to better suite our needs with the mss project.
       */

      url =
        `${prefixes["apple-maps"]}?` +
        [
          sourceLatLng ? `saddr=${sourceLatLng}` : null,
          latlng ? `daddr=${latlng}` : null,
          title && !latlng ? `address=${encodedTitle}` : null
        ]
          .filter(x => x)
          .join("&");
      break
    case 'google-maps':
      let useTitleForQuery = !options.googleForceLatLon && title
      let googlePlaceId = options.googlePlaceId ? options.googlePlaceId : null

      url = prefixes['google-maps']
      url += `?q=${useTitleForQuery ? encodedTitle : latlng}`
      url += (isIOS) ? '&api=1' : ''
      url += (googlePlaceId) ? `&query_place_id=${googlePlaceId}` : ''
      url += (useSourceDestiny) ? `&saddr=${sourceLatLng}&daddr=${latlng}` : `&ll=${latlng}`
      break
    case 'citymapper':
      url = `${prefixes['citymapper']}directions?endcoord=${latlng}`

      if (title) {
        url += `&endname=${encodedTitle}`
      }

      if (useSourceDestiny) {
        url += `&startcoord=${sourceLatLng}`
      }
      break
    case 'uber':
      url = `${prefixes['uber']}?action=setPickup&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}`

      if (title) {
        url += `&dropoff[nickname]=${encodedTitle}`
      }

      url += (useSourceDestiny) ? `&pickup[latitude]=${sourceLat}&pickup[longitude]=${sourceLng}` : `&pickup=my_location`

      break
    case 'lyft':
      url = `${prefixes['lyft']}ridetype?id=lyft&destination[latitude]=${lat}&destination[longitude]=${lng}`

      if (useSourceDestiny) {
        url += `&pickup[latitude]=${sourceLat}&pickup[longitude]=${sourceLng}`
      }

      break
    case 'transit':
      url = `${prefixes['transit']}directions?to=${latlng}`

      if (useSourceDestiny) {
        url += `&from=${sourceLatLng}`
      }
      break
    case 'waze':
      url = `${prefixes['waze']}?ll=${latlng}&navigate=yes`
      if (title) {
        url += `&q=${encodedTitle}`
      }
      break
    case 'yandex':
      url = `${prefixes['yandex']}build_route_on_map?lat_to=${lat}&lon_to=${lng}`

      if (useSourceDestiny) {
        url += `&lat_from=${sourceLat}&lon_from=${sourceLng}`
      }
      break
    case 'moovit':
      url = `${prefixes['moovit']}directions?dest_lat=${lat}&dest_lon=${lng}`

      if (title) {
        url += `&dest_name=${encodedTitle}`
      }

      if (useSourceDestiny) {
        url += `&orig_lat=${sourceLat}&orig_lon=${sourceLng}`
      }
      break
    case 'yandex-maps':
      url = `${prefixes['yandex-maps']}?pt=${lng},${lat}`

      break
  }

  if (url) {
    return Linking.openURL(url)
  }
}
