import { Cmd } from '../index';

declare module 'react-redux' {
  export function useDispatch<TDispatch = Cmd.Dispatch>(): TDispatch;
}
