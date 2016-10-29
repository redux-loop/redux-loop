# <img alt='redux-loop' src='https://raw.githubusercontent.com/redux-loop/redux-loop/master/logo/logo.png' height='200'>

[![Build Status](https://travis-ci.org/redux-loop/redux-loop.svg?branch=master)](https://travis-ci.org/redux-loop/redux-loop)


A port of [Elm Architecture `Cmd`](http://www.elm-tutorial.org/en/03-subs-cmds/02-commands.html) to Redux
that allows you to express effects like HTTP requests by returning them from your reducers.

> Looing for the v2 docs? Find them [here](https://github.com/redux-loop/redux-loop/tree/v2.2.2/docs).

## Credits

Credit for the ideas and concepts that go into this library to [Evan
Czaplicki](https://github.com/evancz) and all of the work he and others have put
into [Elm](https://github.com/elm-lang). Thanks also to
[Folktale.js](https://github.com/folktale/data.task) for inspiration on the
implementation and method naming on Tasks.

## FAQ

> Isn't it incorrect to cause side-effects in a reducer?

Yes! Absolutely.

> Doesn't redux-loop put side-effects in the reducer?

It doesn't. The values returned from the reducer when scheduling an effect with
redux-loop only _describe_ the effect. Calling the reducer will not cause the
effect to run. The value returned by the reducer is just an object that the
store knows how to interpret when it is enhanced by redux-loop. You can safely
call a reducer in your tests without worrying about waiting for effects to finish
and what they will do to your environment.

> What are the environment requirements for redux-loop?

`redux-loop` requires polyfills for ES6 `Promise` and `Symbol` to be included if
the browsers you target don't natively support them.

## Why use this?

Having used and followed the progression of Redux and the Elm Architecture, and
after trying other effect patterns for Redux, we came to the following
conclusion:

> Synchronous state transitions caused by returning a new state from the reducer
> in response to an action are just one of all possible effects an action can
> have on application state.

Many other methods for handling effects in Redux, especially those implemented
with action-creators, incorrectly teach the user that asynchronous effects are
fundamentally different from synchronous state transitions. This separation
encourages divergent and increasingly specific means of processing particular
types effects. Instead, we should focus on making our reducers powerful enough
to handle asynchronous effects as well as synchronous state transitions. With
`redux-loop`, the reducer doesn't just decide what happens _*now*_ due to a
particular action, it decides what happens _*next*_. All of the behavior of your
application can be traced through one place, and that behavior can be easily broken
apart and composed back together. This is one of the most powerful features of the
[Elm architecture](https://guide.elm-lang.org/architecture/), and with
`redux-loop` it is a feature of Redux as well.

## Support

Potential bugs, generally discussion, and proposals or RFCs should be submitted
as issues to this repo, we'll do our best to address them quickly. We use this
library as well and want it to be the best it can! For questions about using the
library, [submit questions on StackOverflow](http://stackoverflow.com/questions/ask)
with the [`redux-loop` tag](http://stackoverflow.com/questions/tagged/redux-loop).

## Contributing

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms. Multiple language translations are available at [contributor-covenant.org](http://contributor-covenant.org/version/1/3/0/i18n/)
