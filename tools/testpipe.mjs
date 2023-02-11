const req = { a: '1' }
const res = { b: 2 }

function printReq(ctx) {
  console.log(ctx.req)
  ctx.res.abc = 123
  ctx.finalize = true
}

function printRes(ctx) {
  console.log(ctx.res)
}

function printCtx(ctx) {
  console.log(ctx)
}

// const Pipeline = ctx => ({
//   then: func => Pipeline(func(ctx)),
// })

// Pipeline({ req, res })
//   .then(printReq) // instead of: _ => Object.keys(_)
//   .then(printRes)
//   .then(printCtx)

class Pipeline {
  #context

  constructor(context) {
    this.#context = context
  }

  then(func) {
    !this.#context.finalize && func(this.#context)
    return this
  }
  finally(func) {
    func(this.#context)
    return this
  }
}

new Pipeline({ req, res }).then(printReq).then(printRes).then(printCtx).finally(console.log).finally(console.log)
