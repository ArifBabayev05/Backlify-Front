import { createMachine } from 'xstate';

const promptMachine = createMachine({
  id: 'prompt',
  initial: 'idle',
  states: {
    idle: {
      on: {
        SUBMIT: 'processing'
      }
    },
    processing: {
      on: {
        SUCCESS: 'success',
        ERROR: 'error',
        RESET: 'idle'
      }
    },
    success: {
      on: {
        RESET: 'idle'
      }
    },
    error: {
      on: {
        RESET: 'idle'
      }
    }
  }
});

export default promptMachine; 