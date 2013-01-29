function(doc) {
  if (doc.isEggcount) emit(doc.date, doc.count);
}