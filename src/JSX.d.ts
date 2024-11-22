// https://lwebapp.com/en/post/custom-jsx
declare namespace JSX {
  type Element = HTMLElement
  interface IntrinsicElements {
    [elName: string]: unknown
  }
}
