import Vue from 'vue'
import throttle from 'lodash/throttle'
const extend = (app, mixin) => {
  if (!app.mixins) {
    app.mixins = []
  }
  app.mixins.push(mixin)
}


const defaultOptions = {
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  options: {
    polyfill: true,
    throttle: 200
  }
}

const defaultBreakpoints = {
  current: 'xs',

  xs: true,

  sm: false,
  lSm: true,
  sSm: false,

  md: false,
  lMd: true,
  sMd: false,

  lg: false,
  lLg: true,
  sLg: false,

  xl: false,

  width: 0,
  height: 0
}

const transformBreakpoints = (breakpoints, { width, height }, options) => {
  const { sm, md, lg, xl } = options

  const breakpointRoles = { xs: 0, sm: 1, md: 2, lg: 3, xl: 4 }

  let currentActive = 'xs'

  switch (true) {
    case width >= xl:
      currentActive = 'xl'
      break
    case width >= lg:
      currentActive = 'lg'
      break
    case width >= md:
      currentActive = 'md'
      break
    case width >= sm:
      currentActive = 'sm'
      break
    default:
      currentActive = 'xs'
      break
  }

  const decideLargeOrSmallThan = (point, large = false) =>
    large
      ? breakpointRoles[point] <= breakpointRoles[currentActive]
      : breakpointRoles[point] >= breakpointRoles[currentActive]

  const transformData = {
    sm: currentActive === 'sm',
    lSm: decideLargeOrSmallThan('sm', true),
    sSm: decideLargeOrSmallThan('sm'),

    md: currentActive === 'md',
    lMd: decideLargeOrSmallThan('md', true),
    sMd: decideLargeOrSmallThan('md'),

    lg: currentActive === 'lg',
    lLg: decideLargeOrSmallThan('lg', true),
    sLg: decideLargeOrSmallThan('lg')
  }

  Object.assign(breakpoints, transformData, {
    current: currentActive,
    xs: currentActive === 'xs',
    xl: currentActive === 'xl',
    width: ~~width,
    height: ~~height
  })
}

export default async (ctx, inject) => {
  const options = { ...defaultOptions, ...<%= JSON.stringify(options, null, 2) %>}


  const breakpoints = Vue.observable(defaultBreakpoints)

  if (process.server) {
    ctx.$breakpoints = breakpoints
    inject('breakpoints', breakpoints)
    return
  }

  const needPolyfill =
    !Object.prototype.hasOwnProperty.call(window, 'ResizeObserver') &&
    options.options.polyfill



  if (needPolyfill) {
    const ResizeObserver = await import('resize-observer-polyfill')

    Object.defineProperty(window, 'ResizeObserver', {
      value: ResizeObserver.default,
      writable: false
    })
  }

  const bodyElem = document.querySelector('body')

  const resizeObserver = new ResizeObserver(
    throttle((entries) => {
      const [{ contentRect }] = entries
      transformBreakpoints(breakpoints, contentRect, options)
    }, +options.options.throttle, { trailing: true, leading: false })
  )

  extend(ctx.app, {
    beforeDestroy () {
      resizeObserver.unobserve(bodyElem)
    }
  })

  resizeObserver.observe(bodyElem)

  ctx.$breakpoints = breakpoints
  inject('breakpoints', breakpoints)
}
