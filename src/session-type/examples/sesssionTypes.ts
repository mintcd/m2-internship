import { send, end, goto, receive, tag } from "../src/SessionType";
import { Ack, Frame } from "./dataTypes";


export const stopAndWait =
  tag('S')
    .send(Frame)
    .offer({
      ack: receive(Ack)
        .select({
          continue: goto('S'),
          end: end()
        }),
      unack: goto('S')
    });

export const lazyStopAndWait =
  tag('S')
    .select({
      end: end(),
      continue: send(Frame)
        .offer({
          ack: receive(Ack).goto('S'),
          unack: goto('S')
        })
    })

export const lazyStopAndWaitSeqAck = 0


// export const goBack2 =
//   tag('22') // all frame is acked
//     .select({
//       end: end(),
//       continue: tag('00') // no frame is sent
//         .send(Frame).offer({
//           ack1: receive(Ack).tag('20').send(Frame) // if acked, send frame 2
//             .offer({
//               ack2: receive(Ack).goto('22'), // if frame 2 is acked, return initial state
//               unack2: goto('20')             // else resend it
//             }),
//           unack1: tag('10').send(Frame).offer({  // if unacked, still send frame 2
//             ack1: receive(Ack).tag('21').offer({ // if frame 1 is now acked, wait for if frame 2 is acked
//               ack2: receive(Ack).goto('22'),     // if frame 2 is acked, return initial state
//               unack2: send(Frame).goto('21')     // else resend and wait
//             }),
//             ack2: receive(Ack).tag('12').offer({ // if frame 2 is now acked, wait for if frame 1 is acked
//               ack1: receive(Ack).goto('22'),     // if frame 1 is acked, return initial state
//               unack1: send(Frame).goto('12')     // else resend and wait
//             }),
//             unacked: goto('00')                   // else resend both frames
//           })
//         })
//     })


export const goBack2 = // states encode (seq, num)
  tag('00').select({
    end: end(),
    continue: send(Frame).tag('10').offer({
      ack: receive(Ack).tag('11').send(Frame).tag('21').offer({
        ack: receive(Ack).tag('22').send(Frame).tag('02')
      })
    })
  })