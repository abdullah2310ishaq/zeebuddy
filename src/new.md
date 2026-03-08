API Updates ASAP

GET /api/v1/news add userLiked to each post when user authenticated. Check Like collection targetType post targetId post._id userId currentUser._id. If exists userLiked true else false. When not authenticated omit or false.

GET /api/v1/news/:id add userLiked to post when user authenticated. Same check Like collection. If exists userLiked true else false. When not authenticated omit or false.

GET /api/v1/news populate author for each post same as detail. For authorType user include author id name avatarUrl. Or populate authorId userId createdBy with User doc name avatarUrl. List must have author data so app shows real names not User or Admin.
