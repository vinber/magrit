/* Generated by Cython 0.29.6 */

#ifndef __PYX_HAVE__magrit_app__helpers__transform
#define __PYX_HAVE__magrit_app__helpers__transform

struct Point;
typedef struct Point Point;

/* "magrit_app/helpers/transform.pyx":5
 * #cython: boundscheck=False
 * #cython: cdivision=True
 * ctypedef public struct Point:             # <<<<<<<<<<<<<<
 *     double x
 *     double y
 */
struct Point {
  double x;
  double y;
};

#ifndef __PYX_HAVE_API__magrit_app__helpers__transform

#ifndef __PYX_EXTERN_C
  #ifdef __cplusplus
    #define __PYX_EXTERN_C extern "C"
  #else
    #define __PYX_EXTERN_C extern
  #endif
#endif

#ifndef DL_IMPORT
  #define DL_IMPORT(_T) _T
#endif

#endif /* !__PYX_HAVE_API__magrit_app__helpers__transform */

/* WARNING: the interface of the module init function changed in CPython 3.5. */
/* It now returns a PyModuleDef instance instead of a PyModule instance. */

#if PY_MAJOR_VERSION < 3
PyMODINIT_FUNC inittransform(void);
#else
PyMODINIT_FUNC PyInit_transform(void);
#endif

#endif /* !__PYX_HAVE__magrit_app__helpers__transform */
