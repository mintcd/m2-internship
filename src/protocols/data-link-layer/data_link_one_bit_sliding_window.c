/* Protocol 4 (Sliding window) is bidirectional. */
#define MAX SEQ 1 /* must be 1 for protocol 4 */
typedef enum {frame_arrival, cksum_err, timeout} event_type;

