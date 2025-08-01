const slugify = require('slugify');

const generateSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
};

const generateUniqueSlug = async (text, model, field = 'slug') => {
  let slug = generateSlug(text);
  let counter = 1;
  let originalSlug = slug;

  while (await model.findFirst({ where: { [field]: slug } })) {
    slug = `${originalSlug}-${counter}`;
    counter++;
  }

  return slug;
};

module.exports = {
  generateSlug,
  generateUniqueSlug
};